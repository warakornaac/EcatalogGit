using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Ecatalog.Models;
using Ecatalog.Library;

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
                        false,
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
                var result = await Utils.CallApiAsyncMemory<ModelRangeFilterModel>(
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
    }
}