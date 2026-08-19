using Ecatalog.Helpers;
using Ecatalog.Library;
using Ecatalog.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
namespace Ecatalog.Controllers
{
    public class ProductController : Controller
    {
        // GET: Product
        public async Task<ActionResult> GetProductBySearchVio(
            string marketSegmentId, string segmentId, string makerId, string rangeId,
            string bodyId, string engineId, string yearFrom, string yearTo,
            string driveType, string imagePath, string slmCode, string cusCode,
            string[] company)   // ✅ เปลี่ยนจาก string เป็น string[]
        {
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
                        SlmCode = slmCode,   // ✅ ตัวใหญ่ตาม External API
                        CusCode = cusCode,   // ✅
                        Company = company    // ✅
                    },
                    true,
                    30);

                var groupData = result.Data?.result?
                    .GroupBy(x => x.productGroup)
                    .Select(g => new
                    {
                        productGroupNameMain = g.Key,
                        productList = g.ToList()
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
            try
            {
                var result = await Utils.CallApiAsyncMemory<ProductSearchCatagoryResponseModel> ( // ✅ เปลี่ยน
                    "Ecatalog/GetProductBySearchCatagory",
                    "POST",
                    request,
                    false,
                    300);

                if (result == null)
                {
                    return Json(new
                    {
                        IsSuccess = false,
                        Message = "API Response is null"
                    });
                }

                var groupData =
                    result.Data?.result?
                    .GroupBy(x => x.productGroup)
                    .Select(g => new {
                        productGroupNameMain = g.Key,
                        productList = g.ToList()
                    })
                    .ToList();

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = groupData
                });
            }
            catch (Exception ex)
            {
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
        [HttpPost]
        public async Task<ActionResult> GetProductBySearchField(ProductSearchFieldRequestModel request) {
            try {
                var result =
                    await Utils.CallApiAsyncMemory<
                        ProductSearchVioModel>(
                        "Ecatalog/GetProductBySearchField",
                        "POST",
                        request,
                        true,
                        30);

                if (result == null) {
                    return Json(new {
                        IsSuccess = false,
                        Message = "API Response is null"
                    });
                }

                var groupData =
                  result.Data?.result?
                  .GroupBy(x => x.productGroup)
                  .Select(g => new {
                      productGroupNameMain = g.Key,
                      productList = g.ToList()
                  })
                  .ToList();

                return Json(new {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = groupData
                });
            }
            catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    IsFromCache = false,
                    ExecutionTime = 0,
                    Message = ex.Message,
                    Data = new List<object>()
                });
            }
        }
        public async Task<ActionResult> GetProductBySearchGlobal(string Keyword, bool Debug = false)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<Newtonsoft.Json.Linq.JObject>(
                    "Ecatalog/GetProductBySearchGlobal",
                    "GET",
                    new { Keyword, Debug },
                    false,
                    30);

                if (result == null || !result.IsSuccess || result.Data == null)
                {
                    return Json(new
                    {
                        IsSuccess = false,
                        Message = result?.ErrorMessage ?? "API Response is null"
                    }, JsonRequestBehavior.AllowGet);
                }

                var items = result.Data["result"]?
                    .ToObject<List<ResultProductSearchVioModelList>>();

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
                    .Select(g => new {
                        productGroupNameMain = g.Key,
                        productList = g.ToList()
                    })
                    .ToList();

                return Json(new
                {
                    IsSuccess = true,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = groupData
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                }, JsonRequestBehavior.AllowGet);
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
    }
}
