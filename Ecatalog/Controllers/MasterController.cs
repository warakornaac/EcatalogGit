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
        public async Task<ActionResult> GetBody(string marketSegmentId, string segmentId, string makerId, string rangeId) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                    ModelBodyFilterModel>(
                    "Ecatalog/GetBody",
                    "GET",
                    new {
                        marketSegmentId,
                        segmentId,
                        makerId,
                        rangeId
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
        public async Task<ActionResult> GetEngine(string marketSegmentId, string segmentId, string makerId, string rangeId, string bodyId) {
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
                        bodyId
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

        public async Task<ActionResult> GetBrands()
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    BrandsFilterModel>(
                    "Ecatalog/GetBrands",
                    "GET",
                    new
                    {

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
        public async Task<ActionResult> GeProductGroups()
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ModelProductionGroupFilterModel>(
                    "Ecatalog/GetProductGroup",
                    "GET",
                    new
                    {
                        
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

        public async Task<ActionResult> GeProductLines()
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ModelProductionLineFilterModel>(
                    "Ecatalog/GetProductLine",
                    "GET",
                    new
                    {

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
    }
}