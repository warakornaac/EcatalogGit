using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Ecatalog.Helpers;
using Ecatalog.Library;
using Ecatalog.Models;
using Ecatalog.Services;

namespace Ecatalog.Controllers
{
    public class ProductController : Controller
    {

        public async Task<ActionResult> GetProductBySearchVio(
            string marketSegmentId, string segmentId, string makerId, string rangeId, string modelRangeId,
            string bodyId, string engineId, string yearFrom, string yearTo,
            string driveType, string imagePath, string slmCode, string cusCode,
            string[] company)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                var result = await Utils.CallApiAsyncMemory<ProductSearchVioModel>(
                    "Ecatalog/GetProductBySearchVio",
                    "GET",
                    new
                    {
                        marketSegmentId,
                        segmentId,
                        makerId,
                        rangeId,
                        bodyId,
                        engineId,
                        yearFrom,
                        yearTo,
                        driveType,
                        imagePath,
                        SlmCode = slmCode,
                        CusCode = cusCode,
                        Company = company,
                        modelRangeId
                    },
                    false,
                    30);

                stopwatch.Stop();

                // =========================
                // Search Log
                // =========================
                var resultCount = result?.Data?.result?.Count() ?? 0;

                var searchStatus =
                    result == null
                        ? "ERROR"
                        : !result.IsSuccess
                            ? "ERROR"
                            : resultCount == 0
                                ? "NO_RESULT"
                                : "SUCCESS";

                var searchLog = new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "VIO",

                    MarketSegmentId = marketSegmentId,
                    SegmentId = segmentId,
                    MakerId = makerId,
                    RangeId = rangeId,
                    BodyId = bodyId,
                    EngineId = engineId,
                    YearFrom = yearFrom,
                    YearTo = yearTo,
                    DriveType = driveType,

                    SlmCode = slmCode,
                    CusCode = cusCode,
                    Company = company != null
                        ? string.Join(",", company)
                        : null,

                    ResultCount = resultCount,
                    SearchStatus = searchStatus,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                };

                await new SearchLogService().SaveSearchLog(searchLog);

                // =========================
                // Existing code
                // =========================

                var groupData = result.Data?.result?
                .GroupBy(x => x.productGroup)
                .Select(g => new
                {
                    productGroupNameMain = g.Key,
                    productList = g.Select(item => new
                    {
                        stkcode = item.stkcode,
                        stkcodeDescription = item.stkcodeDescription,
                        brand = item.brand,
                        makerName = item.makerName,
                        modelName = item.modelName,
                        qtyReady = item.qtyReady,
                        price = item.price,
                        productGroup = item.productGroup,
                        productLine = item.productLine,
                        imagePath = item.imagePath,
                        fittingDescription = item.fittingDescription,

                        // API ส่ง company มาเป็น string เดียวตรงๆ ใช้เลย
                        // ถ้าว่างค่อย fallback ไปที่ request param ตัวแรก
                        company = !string.IsNullOrEmpty(item.company)
                            ? item.company
                            : (company != null && company.Any() ? company.First() : ""),

                        slmCode = item.slmCode ?? slmCode ?? "",
                        cusCode = item.cusCode ?? cusCode ?? ""
                    }).ToList()
                })
                .ToList();

                return new LargeJsonResult
                {
                    Data = new
                    {
                        IsSuccess = result.IsSuccess,
                        IsFromCache = result.IsFromCache,
                        ExecutionTime = result.ExecutionTime,
                        Data = groupData
                    },
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // =========================
                // Search Log : ERROR
                // =========================
                var searchLog = new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "VIO",

                    MarketSegmentId = marketSegmentId,
                    SegmentId = segmentId,
                    MakerId = makerId,
                    RangeId = rangeId,
                    BodyId = bodyId,
                    EngineId = engineId,
                    YearFrom = yearFrom,
                    YearTo = yearTo,
                    DriveType = driveType,

                    SlmCode = slmCode,
                    CusCode = cusCode,
                    Company = company != null
                        ? string.Join(",", company)
                        : null,

                    ResultCount = 0,
                    SearchStatus = "ERROR",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                };

                await new SearchLogService().SaveSearchLog(searchLog);

                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<ActionResult> GetProductBySearchCatagory(ProductSearchCatagoryRequestModel request)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                System.Diagnostics.Debug.WriteLine($"[CAT] SlmCode={request.SlmCode} | CusCode={request.CusCode} | Company={string.Join(",", request.Company ?? new List<string>())} | GroupId={string.Join(",", request.productGroupId ?? new List<string>())}");
                var result = await Utils.CallApiAsyncMemory<ProductSearchCatagoryResponseModel>( // ✅ เปลี่ยน
                    "Ecatalog/GetProductBySearchCatagory",
                    "POST",
                    request,
                    false,
                    120
                );
                System.Diagnostics.Debug.WriteLine($"[CAT] IsSuccess={result.IsSuccess} | ErrorMessage={result.ErrorMessage}");

                var products = result.Data?.result?.ToList() ?? new List<ResultProductSearchCatagory>();

                // ★ 1) คู่ stkcode + company จริงของสินค้า (ไม่ซ้ำ)
                var moqRequestItems = products
                    .Where(x => !string.IsNullOrWhiteSpace(x.stkcode)
                             && !string.IsNullOrWhiteSpace(x.company))
                    .Select(x => new { stkcode = x.stkcode.Trim(), company = x.company.Trim() })
                    .Distinct()
                    .Select(x => new ProductMoqPriceRequestItemModel { stkcode = x.stkcode, company = x.company })
                    .ToList();

                // ★ 2) เรียก API ครั้งเดียว
                var moqLookup = await KeyMoqPriceResult.GetUomPriceLookupAsync(moqRequestItems, request.CusCode);


                stopwatch.Stop();

                System.Diagnostics.Debug.WriteLine($"[CAT] IsSuccess={result.IsSuccess} | ErrorMessage={result.ErrorMessage}");

                if (result == null)
                {
                    // Log ERROR
                    await new SearchLogService().SaveSearchLog(new SearchLogModel
                    {
                        UserId = Session["username"]?.ToString() ?? "",
                        UserType = Session["UserType"]?.ToString() ?? "",

                        SearchType = "CATEGORY",

                        ProductGroupId = request?.productGroupId != null
                            ? string.Join(",", request.productGroupId)
                            : null,

                        ProductLineId = request?.productLineId != null
                            ? string.Join(",", request.productLineId)
                            : null,

                        BrandId = request?.brandId != null
                            ? string.Join(",", request.brandId)
                            : null,

                        FittingFilter = request?.fittingFilter != null
                            ? string.Join(",", request.fittingFilter)
                            : null,

                        MarketSegmentId = request?.marketSegmentId,
                        SegmentId = request?.segmentId,
                        MakerId = request?.makerId,
                        RangeId = request?.rangeId,
                        BodyId = request?.bodyId,
                        EngineId = request?.engineId,
                        YearFrom = request?.yearFrom,
                        YearTo = request?.yearTo,
                        DriveType = request?.driveType,

                        SlmCode = request?.SlmCode,
                        CusCode = request?.CusCode,

                        Company = request?.Company != null
                            ? string.Join(",", request.Company)
                            : null,

                        ResultCount = 0,
                        SearchStatus = "ERROR",
                        ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                    });

                    return Json(new
                    {
                        IsSuccess = false,
                        Message = "API Response is null"
                    });
                }

                // จำนวนสินค้าจริง
                var resultCount = result.Data?.result?.Count() ?? 0;

                var searchStatus =
                    !result.IsSuccess
                        ? "ERROR"
                        : resultCount == 0
                            ? "NO_RESULT"
                            : "SUCCESS";

                // =========================
                // Search Log
                // =========================
                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "CATEGORY",

                    ProductGroupId = request.productGroupId != null
                        ? string.Join(",", request.productGroupId)
                        : null,

                    ProductLineId = request.productLineId != null
                        ? string.Join(",", request.productLineId)
                        : null,

                    BrandId = request.brandId != null
                        ? string.Join(",", request.brandId)
                        : null,

                    FittingFilter = request.fittingFilter != null
                        ? string.Join(",", request.fittingFilter)
                        : null,

                    MarketSegmentId = request.marketSegmentId,
                    SegmentId = request.segmentId,
                    MakerId = request.makerId,
                    RangeId = request.rangeId,
                    BodyId = request.bodyId,
                    EngineId = request.engineId,
                    YearFrom = request.yearFrom,
                    YearTo = request.yearTo,
                    DriveType = request.driveType,

                    SlmCode = request.SlmCode,
                    CusCode = request.CusCode,

                    Company = request.Company != null
                        ? string.Join(",", request.Company)
                        : null,

                    ResultCount = resultCount,
                    SearchStatus = searchStatus,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                var groupData = result.Data?.result?
                .GroupBy(x => x.productGroup)
                .Select(g => new
                {
                    productGroupNameMain = g.Key,
                    productList = g.Select(item => new
                    {
                        productGroupId = item.productGroupId,
                        productGroup = item.productGroup,
                        productLineId = item.productLineId,
                        productLine = item.productLine,
                        brandId = item.brandId,
                        brand = item.brand,
                        stkcode = item.stkcode,
                        stkcodeDescription = item.stkcodeDescription,
                        price = item.price,
                        qtyReady = item.qtyReady,
                        makerName = item.makerName,
                        modelName = item.modelName,
                        imagePath = item.imagePath,
                        imageUrl = item.imageUrl,
                        slmCode = item.slmCode ?? request.SlmCode ?? "",
                        cusCode = item.cusCode ?? request.CusCode ?? "",

                        // API ส่ง company เป็น string เดียว
                        company = !string.IsNullOrEmpty(item.company)
                            ? item.company
                            : (request.Company != null && request.Company.Any() ? request.Company.First() : ""),

                        fittingDescription = item.fittingDescription
                    }).ToList()
                })
                .ToList();

                return CustomJson(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = groupData
                });
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                // =========================
                // Search Log : ERROR
                // =========================
                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "CATEGORY",

                    ProductGroupId = request?.productGroupId != null
                        ? string.Join(",", request.productGroupId)
                        : null,

                    ProductLineId = request?.productLineId != null
                        ? string.Join(",", request.productLineId)
                        : null,

                    BrandId = request?.brandId != null
                        ? string.Join(",", request.brandId)
                        : null,

                    FittingFilter = request?.fittingFilter != null
                        ? string.Join(",", request.fittingFilter)
                        : null,

                    MarketSegmentId = request?.marketSegmentId,
                    SegmentId = request?.segmentId,
                    MakerId = request?.makerId,
                    RangeId = request?.rangeId,
                    BodyId = request?.bodyId,
                    EngineId = request?.engineId,
                    YearFrom = request?.yearFrom,
                    YearTo = request?.yearTo,
                    DriveType = request?.driveType,

                    SlmCode = request?.SlmCode,
                    CusCode = request?.CusCode,

                    Company = request?.Company != null
                        ? string.Join(",", request.Company)
                        : null,

                    ResultCount = 0,
                    SearchStatus = "ERROR",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                return CustomJson(new
                {
                    IsSuccess = false,
                    IsFromCache = false,
                    ExecutionTime = 0,
                    Message = ex.Message,
                    Data = new List<object>()
                });
            }
        }

        [HttpPost]
        public async Task<ActionResult> GetProductBySearchField(ProductSearchFieldRequestModel request)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[FIELD] searchText={request.searchText} | SlmCode={request.SlmCode} | CusCode={request.CusCode}");

                var result =
                    await Utils.CallApiAsyncMemory<
                        ProductSearchVioModel>(
                        "Ecatalog/GetProductBySearchField",
                        "POST",
                        request,
                        false,
                        30);

                stopwatch.Stop();

                System.Diagnostics.Debug.WriteLine(
                    $"[FIELD] IsSuccess={result?.IsSuccess} | ErrorMessage={result?.ErrorMessage}");

                if (result == null)
                {
                    await new SearchLogService().SaveSearchLog(new SearchLogModel
                    {
                        UserId = Session["username"]?.ToString() ?? "",
                        UserType = Session["UserType"]?.ToString() ?? "",

                        SearchType = "FIELD",
                        SearchText = request?.searchText,
                        SearchFields = request?.searchFields != null
                            ? string.Join(",", request.searchFields)
                            : null,
                        SlmCode = request?.SlmCode,
                        CusCode = request?.CusCode,
                        Company = request?.Company != null
                            ? string.Join(",", request.Company)
                            : null,
                        ResultCount = 0,
                        SearchStatus = "ERROR",
                        ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                    });

                    return Json(new
                    {
                        IsSuccess = false,
                        Message = "API Response is null"
                    });
                }

                var resultCount = result.Data?.result?.Count() ?? 0;

                var searchStatus =
                    !result.IsSuccess
                        ? "ERROR"
                        : resultCount == 0
                            ? "NO_RESULT"
                            : "SUCCESS";

                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "FIELD",
                    SearchText = request?.searchText,
                    SearchFields = request?.searchFields != null
                    ? string.Join(",", request.searchFields)
                    : null,

                    MarketSegmentId = request?.marketSegmentId,
                    SegmentId = request?.segmentId,
                    MakerId = request?.makerId,
                    RangeId = request?.rangeId,
                    BodyId = request?.bodyId,
                    EngineId = request?.engineId,
                    YearFrom = request?.yearFrom,
                    YearTo = request?.yearTo,
                    DriveType = request?.driveType,

                    SlmCode = request?.SlmCode,
                    CusCode = request?.CusCode,

                    Company = request?.Company != null
                    ? string.Join(",", request.Company)
                    : null,

                    ResultCount = resultCount,
                    SearchStatus = searchStatus,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                var groupData = result.Data?.result?
                .GroupBy(x => x.productGroup)
                .Select(g => new
                {
                    productGroupNameMain = g.Key,
                    productList = g.Select(item => new
                    {
                        stkcode = item.stkcode,
                        stkcodeDescription = item.stkcodeDescription,
                        brand = item.brand,
                        makerName = item.makerName,
                        modelName = item.modelName,
                        qtyReady = item.qtyReady,
                        price = item.price,
                        productGroup = item.productGroup,
                        productLine = item.productLine,
                        imagePath = item.imagePath,
                        fittingDescription = item.fittingDescription,

                        // API ส่ง company เป็น string เดียว
                        company = !string.IsNullOrEmpty(item.company)
                            ? item.company
                            : (request.Company != null && request.Company.Any() ? request.Company.First() : ""),

                        slmCode = item.slmCode ?? request.SlmCode ?? "",
                        cusCode = item.cusCode ?? request.CusCode ?? ""
                    }).ToList()
                })
                .ToList();

                return new JsonResult
                {
                    Data = new
                    {
                        IsSuccess = result.IsSuccess,
                        IsFromCache = result.IsFromCache,
                        ExecutionTime = result.ExecutionTime,
                        Data = groupData
                    },
                    MaxJsonLength = int.MaxValue
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "FIELD",
                    SearchText = request?.searchText,
                    SearchFields = request?.searchFields != null
                    ? string.Join(",", request.searchFields)
                    : null,

                    MarketSegmentId = request?.marketSegmentId,
                    SegmentId = request?.segmentId,
                    MakerId = request?.makerId,
                    RangeId = request?.rangeId,
                    BodyId = request?.bodyId,
                    EngineId = request?.engineId,
                    YearFrom = request?.yearFrom,
                    YearTo = request?.yearTo,
                    DriveType = request?.driveType,

                    SlmCode = request?.SlmCode,
                    CusCode = request?.CusCode,

                    Company = request?.Company != null
                    ? string.Join(",", request.Company)
                    : null,

                    ResultCount = 0,
                    SearchStatus = "ERROR",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                return Json(new
                {
                    IsSuccess = false,
                    IsFromCache = false,
                    ExecutionTime = 0,
                    Message = ex.Message,
                    Data = new List<object>()
                });
            }
        }

        public async Task<ActionResult> GetProductBySearchGlobal(
            string Keyword,
            string SlmCode,
            string CusCode,
            string[] Company,
            bool Debug = false)
        {
            var stopwatch = Stopwatch.StartNew();
            try
            {
                var result = await Utils.CallApiAsyncMemory<Newtonsoft.Json.Linq.JObject>(
                    "Ecatalog/GetProductBySearchGlobal",
                    "GET",
                    new { Keyword, CusCode, Debug },
                    false,
                    30);

                stopwatch.Stop();

                if (result == null)
                {
                    await new SearchLogService().SaveSearchLog(new SearchLogModel
                    {
                        UserId = Session["username"]?.ToString() ?? "",
                        UserType = Session["UserType"]?.ToString() ?? "",

                        SearchType = "GLOBAL",
                        SearchText = Keyword,

                        SlmCode = SlmCode,
                        CusCode = CusCode,
                        Company = Company != null
                        ? string.Join(",", Company)
                        : null,

                        ResultCount = 0,
                        SearchStatus = "ERROR",
                        ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                    });

                    return Json(new
                    {
                        IsSuccess = false,
                        Message = "API Response is null"
                    }, JsonRequestBehavior.AllowGet);
                }

                if (!result.IsSuccess || result.Data == null)
                {
                    await new SearchLogService().SaveSearchLog(new SearchLogModel
                    {
                        UserId = Session["username"]?.ToString() ?? "",
                        UserType = Session["UserType"]?.ToString() ?? "",

                        SearchType = "GLOBAL",
                        SearchText = Keyword,

                        SlmCode = SlmCode,
                        CusCode = CusCode,
                        Company = Company != null
                        ? string.Join(",", Company)
                        : null,

                        ResultCount = 0,
                        SearchStatus = "ERROR",
                        ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                    });

                    return Json(new
                    {
                        IsSuccess = false,
                        Message = result.ErrorMessage ?? "API Response is invalid"
                    }, JsonRequestBehavior.AllowGet);
                }

                var items = result.Data["result"]?
                    .ToObject<List<ResultProductSearchVioModelList>>();

                var resultCount = items?.Count ?? 0;

                var searchStatus =
                    resultCount == 0
                        ? "NO_RESULT"
                        : "SUCCESS";

                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "GLOBAL",
                    SearchText = Keyword,

                    SlmCode = SlmCode,
                    CusCode = CusCode,
                    Company = Company != null
                        ? string.Join(",", Company)
                        : null,

                    ResultCount = resultCount,
                    SearchStatus = searchStatus,
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                if (items == null || !items.Any())
                {
                    return Json(new
                    {
                        IsSuccess = false,
                        Message = result.Data["errorMessage"]?.ToString() ?? "ไม่พบข้อมูล"
                    }, JsonRequestBehavior.AllowGet);
                }

                var groupData = items
                    .GroupBy(x => x.productGroup)
                    .Select(g => new
                    {
                        productGroupNameMain = g.Key,
                        productList = g.ToList()
                    })
                    .ToList();

                return new JsonResult
                {
                    Data = new
                    {
                        IsSuccess = true,
                        IsFromCache = result.IsFromCache,
                        ExecutionTime = result.ExecutionTime,
                        Data = groupData
                    },
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                    MaxJsonLength = int.MaxValue
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                await new SearchLogService().SaveSearchLog(new SearchLogModel
                {
                    UserId = Session["username"]?.ToString() ?? "",
                    UserType = Session["UserType"]?.ToString() ?? "",

                    SearchType = "GLOBAL",
                    SearchText = Keyword,

                    SlmCode = SlmCode,
                    CusCode = CusCode,
                    Company = Company != null
                        ? string.Join(",", Company)
                        : null,

                    ResultCount = 0,
                    SearchStatus = "ERROR",
                    ResponseTimeMs = (int)stopwatch.ElapsedMilliseconds
                });

                return new JsonResult
                {
                    Data = new
                    {
                        IsSuccess = false,
                        Message = ex.Message,
                        Detail = ex.ToString()
                    },
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet,
                    MaxJsonLength = int.MaxValue
                };
            }
        }        
        
        //get count by tab
        public async Task<ActionResult> GetTabItemCountProduct(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabItemCountModel>(
                    "Ecatalog/GetTabItemCountProduct",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    

                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },

                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        //get tab Description
        public async Task<ActionResult> GetTabDescription(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabDescriptionModel>(
                    "Ecatalog/GetTabDescription",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        // get tab Specification
        public async Task<ActionResult> GetTabSpec(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabSpecModel>(
                    "Ecatalog/GetTabSpec",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        // get tab Images
        public async Task<ActionResult> GetTabImage(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabImageModel>(
                    "Ecatalog/GetTabImage",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        // get tab Oem
        public async Task<ActionResult> GetTabOem(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabOemModel>(
                    "Ecatalog/GetTabOem",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        // get Competitor
        public async Task<ActionResult> GetTabCompetitor(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabCompetitorModel>(
                    "Ecatalog/GetTabCompetitor",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        // get tab linkage
        public async Task<ActionResult> GetTabLinkage(string stkcode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductTabLinkageModel>(
                    "Ecatalog/GetTabLinkage",
                    "GET",
                    new
                    {
                        stkcode
                    },
                    true,
                    30);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,


                    Debug_DataIsNull = result.Data == null,
                    Debug_ResultIsNull = result.Data?.result == null,
                    Debug_ResultCount = result.Data?.result?.Count ?? 0,

                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public async Task<ActionResult> AddProductToCart(string Cuscode, string Stkcode, string Price, string Qty, string BackOrder="0", string Company = "TAC" )
        {
            Boolean IsSuccess = false;
            string ResponseString = "";
            string username = Session["username"].ToString();
            //string StatusResponse = "Y";
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                        AddToCartResponse>(
                            $"Ecatalog/AddProductToCart?cuscode={Cuscode}&stkcod={Stkcode}&company={Company}&price={Price}&qty={Qty}&backorder={BackOrder}&username={username}",
                            "POST",
                            null,  // ไม่ต้อง body
                        false,
                        10);

                if(result.StatusCode != 200)
                {

                    ResponseString = result.Data.errorMessage.ToString();
                    //StatusResponse = "N";
                }
                else
                {
                    IsSuccess = true;
                    ResponseString = "Added Item";
                }

                return Json(new
                {
                    IsSuccess = IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result,
                    Message = ResponseString
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<ActionResult> GetProductToCart(string cuscode)
        {
            // ✅ รับจาก parameter ก่อน ถ้าไม่ส่งมาค่อย fallback ไปที่ Session
            if (string.IsNullOrWhiteSpace(cuscode))
                cuscode = Session["cuscode"]?.ToString() ?? "";

            string username = Session["username"]?.ToString() ?? "";
            try
            {
                var result = await Utils.CallApiAsyncMemory<ProductCartModel>(
                    "Ecatalog/GetProductToCart",
                    "GET",
                    new
                    {
                        cuscode = cuscode,
                        username = username,
                        t = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                    },
                    false,
                    10);

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<ActionResult> DeleteProductToCart(string ordId, string username)
        {
            if (Session["username"] == null)
                return Json(new { IsSuccess = false, Message = "Session หมดอายุ กรุณา Login ใหม่" }, JsonRequestBehavior.AllowGet);

            username = Session["username"].ToString();

            bool IsSuccess = false;
            string ResponseString = "";

            try
            {
                var result = await Utils.CallApiAsyncMemory<DeleteProductToCart>(
                    $"Ecatalog/DeleteProductToCart?ordId={ordId}&username={username}",
                    "POST",
                    null,
                    false,
                    10);

                if (result.StatusCode != 200)
                {
                    ResponseString = result.Data?.errorMessage ?? "เกิดข้อผิดพลาดจาก API";
                }
                else
                {
                    IsSuccess = true;
                    ResponseString = "Delete Item";
                }

                return Json(new
                {
                    IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result,
                    Message = ResponseString
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> EditProductToCart(int ordid, string cuscod, int qty, decimal price, string username)
        {
            bool IsSuccess = false;
            string ResponseString = "";

            // ✅ ใช้ค่าที่รับมาก่อน ถ้าไม่มีค่อย fallback Session (เดิมทับทิ้งเสมอ ลบทิ้งไป)
            if (string.IsNullOrWhiteSpace(cuscod))
                cuscod = Session["cuscode"]?.ToString() ?? "";

            username = Session["username"]?.ToString() ?? "";
            try
            {
                var result = await Utils.CallApiAsyncMemory<EditProductToCartModel>(
                            $"Ecatalog/EditProductToCart?ordid={ordid}&cuscode={cuscod}&qty={qty}&price={price}&username={username}",
                            "POST",
                            null,
                            false,
                            10);

                if (result.StatusCode != 200 || result.Data?.result == null)
                {
                    IsSuccess = false;
                    ResponseString = result.Data?.errorMessage ?? "อัปเดตจำนวนไม่สำเร็จ (ไม่พบรายการ)";
                }
                else
                {
                    IsSuccess = true;
                    ResponseString = "Edited Item";
                }
                return Json(new
                {
                    IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result,
                    Message = ResponseString
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        private JsonResult CustomJson(object data)
        {
            return new JsonResult
            {
                Data = data,
                ContentType = "application/json",
                ContentEncoding = System.Text.Encoding.UTF8,
                JsonRequestBehavior = JsonRequestBehavior.DenyGet, 
                MaxJsonLength = int.MaxValue 
            };
        }
    }
}
