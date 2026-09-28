using Ecatalog.Library;
using Ecatalog.Models;
using Ecatalog.Services;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.EnterpriseServices;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;

namespace Ecatalog.Controllers
{
    public class MasterController : Controller
    {
        // GET: Master
        public async Task<ActionResult> GetMarketCar(string moduleId) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                        MarketCarFilterModel>(
                        "Ecatalog/GetMarketCar",
                        "GET",
                        new {
                            moduleId = moduleId
                        },
                        true,
                        10);

                if (result.IsSuccess &&
                    result.Data != null &&
                    result.Data.result != null &&
                    result.Data.result.Count > 0) {
                    var user = result.Data.result.FirstOrDefault();
                }

                return Json(new {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<ActionResult> GetMakerCar(string marketSegmentId, string vehicleSegmentId)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                        MarketCarFilterModel>(
                        "Ecatalog/GetMakerCar",
                        "GET",
                        new
                        {
                            marketSegmentId = marketSegmentId,
                            vehicleSegmentId = vehicleSegmentId
                        },
                        true,
                        10);

                if (result.IsSuccess &&
                    result.Data != null &&
                    result.Data.result != null &&
                    result.Data.result.Count > 0)
                {
                    var user = result.Data.result.FirstOrDefault();
                }

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
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

        public async Task<ActionResult> GetModelRange(string marketSegmentId, string segmentId, string makerId) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                    ModelRangeFilterModel>(
                    "Ecatalog/GetModelRange",
                    "GET",
                    new {
                        marketSegmentId,
                        segmentId,
                        makerId
                    },
                    true,
                    10);

                return Json(new {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result
                },
                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }  
        public async Task<ActionResult> GetBody(string marketSegmentId, string segmentId, string makerId, string rangeId, string modelRangeId) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                    ModelBodyFilterModel>(
                    "Ecatalog/GetBody",
                    "GET",
                    new {
                        marketSegmentId,
                        segmentId,
                        makerId,
                        rangeId,
                        modelRangeId
                    },
                    true,
                    10);

                return Json(new {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result
                },

                JsonRequestBehavior.AllowGet);
            } catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> GetEngine(string marketSegmentId, string segmentId, string makerId, string rangeId, string bodyId, string modelRangeId) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                    ModelEngineFilterModel>(
                    "Ecatalog/GetEngine",
                    "GET",
                    new {
                        marketSegmentId,
                        segmentId,
                        makerId,
                        rangeId,
                        bodyId,
                        modelRangeId
                    },
                    true,
                    10);

                return Json(new {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = result.Data?.result
                },

                JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<ActionResult> GetBrands(string id)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    BrandsFilterModel>(
                    "Ecatalog/GetBrands",
                    "GET",
                    new
                    {
                        id
                    },
                    true,
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
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> GetProductGroups(string prodgrpid)
        {
            // ❌ ลบ fallback "All" ออก เพราะ API ไม่รู้จัก
            // if (string.IsNullOrWhiteSpace(prodgrpid)) prodgrpid = "All";

            try
            {
                var result = await Utils.CallApiAsyncMemory<ModelProductionGroupFilterModel>(
                    "Ecatalog/GetProductGroup",
                    "GET",
                    new { prodgrpid },   // ส่งค่าว่างตามที่รับมา
                    false,               // ยังคงปิด cache ไว้ก่อน
                    10);

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = result.Data?.result
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<ActionResult> GetProductLines(string prodlineid)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ModelProductionLineFilterModel>(
                    "Ecatalog/GetProductLine",
                    "GET",
                    new
                    {
                        prodlineid
                    },
                    true,
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
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> GetMatchProductionGroup(string prodgrpid = "")
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    MatchProductGroupModel>(
                    "Ecatalog/GetProductGroupMatched",
                    "GET",
                    new
                    {
                        prodgrpid
                    },
                    true,
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
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> GetSalesmanAll(string slmcode)
        {
            var userType = Session["userType"]?.ToString() ?? "";
            slmcode = userType == "1" || userType == "5" ? "All" : (Session["slmcode"]?.ToString() ?? "All");

            try
            {
                var result = await Utils.CallApiAsyncMemory<GetSalesmanAllModel>(
                    "Ecatalog/GetSalesmanName",
                    "GET",
                    new { slmcode },
                    true,
                    10);

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = result.Data?.result
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        public async Task<ActionResult> GetCustomerbySalesman(string slmcode)
        {
            if (string.IsNullOrWhiteSpace(slmcode)) slmcode = "All";

            try
            {
                var result = await Utils.CallApiAsyncMemory<GetCustomerbySalesmanModel>(
                    "Ecatalog/CustomerbySalesman",
                    "GET",
                    new { slmcode },
                    true,
                    30);  // ← เพิ่ม timeout จาก 10 → 30

                var json = new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = result.Data?.result
                };

                // ← ใช้ Newtonsoft แทน Json() เพื่อหลีก maxJsonLength
                return Content(Newtonsoft.Json.JsonConvert.SerializeObject(json), "application/json");
            }
            catch (Exception ex)
            {
                return Content(Newtonsoft.Json.JsonConvert.SerializeObject(
                    new { IsSuccess = false, Message = ex.Message, Detail = ex.ToString() }
                ), "application/json");
            }
        }
        public async Task<ActionResult> GetInfomantionCustomer(string cuscode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    GetInfomantionCustomerModel>(
                    "Ecatalog/GetInfomantionCustomer",
                    "GET",
                    new
                    {
                        cuscode
                    },
                    true,
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
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        public async Task<ActionResult> GetShiptoByCuscode(string cusCode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<ShiptoByCuscodeModel>(
                "Ecatalog/GetShiptoByCuscode",
                "GET",
                new { cusCode },   // ← ให้ BuildQueryString จัดการ
                true,
                30);
                var raw = Newtonsoft.Json.JsonConvert.SerializeObject(result.Data);
                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    DataIsNull = result.Data == null,
                    ResultIsNull = result.Data?.result == null,
                    ResultCount = result.Data?.result?.Count ?? 0,
                    StatusCode = result.Data?.statusCode,
                    ErrorMessage = result.Data?.errorMessage,
                    Data = result.Data?.result ?? new List<ResultShiptoByCuscode>()
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
        public async Task<ActionResult> GetCustomerByCuscode(string cuscode)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<GetCustomerbySalesmanModel>(
                    "Ecatalog/CustomerByCuscode",
                    "GET",
                    new { cuscode },
                    true, 10);

                return Content(Newtonsoft.Json.JsonConvert.SerializeObject(new
                {
                    IsSuccess = result.IsSuccess,
                    Data = result.Data?.result
                }), "application/json");
            }
            catch (Exception ex)
            {
                return Content(Newtonsoft.Json.JsonConvert.SerializeObject(
                    new { IsSuccess = false, Message = ex.Message }), "application/json");
            }
        }
        [HttpGet]
        public JsonResult GetBrandsByProductLine(string prodLineIds)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(prodLineIds))
                    return Json(new { IsSuccess = false, Data = new List<object>() },
                                JsonRequestBehavior.AllowGet);

                var list = new List<object>();
                string connStr = ConfigurationManager.AppSettings["ECatalogDB"];

                using (var conn = new SqlConnection(connStr))
                using (var cmd = new SqlCommand("P_Get_BrandsByProductLine", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@inProdLineIds", prodLineIds);
                    conn.Open();

                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new
                            {   company = reader["company"].ToString(),
                                id = reader["id"].ToString(),
                                name = reader["name"].ToString(),
                                flag = reader["flag"] == DBNull.Value ? "" : reader["flag"].ToString(),
                                seqNo = reader["seqNo"] == DBNull.Value ? 999 : Convert.ToInt32(reader["seqNo"])
                            });
                        }
                    }
                }

                return Json(new { IsSuccess = true, Data = list },
                            JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new
                {
                    IsSuccess = false,
                    Message = ex.Message,
                    Data = new List<object>()
                },
                            JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public async Task<ActionResult> GetAutocompleteEcat(AutocompleteRequestModel request)
        {
            var stopwatch = Stopwatch.StartNew();

            try
            {
                System.Diagnostics.Debug.WriteLine(
                    $"[AUTOCOMPLETE] insearch={request.insearch} | CusCode={request.cuscode}");

                var result =
                    await Utils.CallApiAsyncMemory<
                        AutocompleteResponeModel>(
                        "Ecatalog/GetAutocompleteEcat",
                        "POST",
                        request,
                        false,
                        30);

                stopwatch.Stop();

                System.Diagnostics.Debug.WriteLine(
                    $"[AUTOCOMPLETE] IsSuccess={result?.IsSuccess} | ErrorMessage={result?.ErrorMessage}");

                if (result == null)
                {
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

                System.Diagnostics.Debug.WriteLine(
                    $"[AUTOCOMPLETE] Status={searchStatus} | Count={resultCount} | Time={result.ExecutionTime} ms");

                return new JsonResult
                {
                    Data = new
                    {
                        IsSuccess = result.IsSuccess,
                        IsFromCache = result.IsFromCache,
                        ExecutionTime = result.ExecutionTime,
                        StatusCode = result.Data?.statusCode,
                        ErrorMessage = result.Data?.errorMessage,
                        Data = result.Data?.result
                    },
                    MaxJsonLength = int.MaxValue
                };
            }
            catch (Exception ex)
            {
                stopwatch.Stop();

                System.Diagnostics.Debug.WriteLine(
                    $"[AUTOCOMPLETE] Exception={ex}");

                return Json(new
                {
                    IsSuccess = false,
                    IsFromCache = false,
                    ExecutionTime = 0,
                    Message = ex.Message,
                    Data = new List<ResultAutocomplete>()
                });
            }
        }
    }
}