using Ecatalog.Library;
using Ecatalog.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
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
            slmcode = userType == "1" ? "All" : (Session["slmcode"]?.ToString() ?? "All");

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
            // ✅ guard: ถ้า caller ส่งค่าว่างมา (ไม่มี slmcode เจาะจง) ให้ดึงลูกค้าทั้งหมด
            if (string.IsNullOrWhiteSpace(slmcode)) slmcode = "All";

            try
            {
                var result = await Utils.CallApiAsyncMemory<GetCustomerbySalesmanModel>(
                    "Ecatalog/CustomerbySalesman",
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
    }
}