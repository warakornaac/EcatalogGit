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
    public class ProductController : Controller
    {
        // GET: Product
        public async Task<ActionResult> GetProductBySearchVio(string marketSegmentId, string segmentId, string makerId, string rangeId, string bodyId, string engineId, string yearFrom, string yearTo, string driveType, string imagePath) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                    ProductSearchVioModel>(
                    "Ecatalog/GetProductBySearchVio",
                    "GET",
                    new {
                        marketSegmentId,
                        segmentId,
                        makerId,
                        rangeId,
                        bodyId,
                        engineId,
                        yearFrom,
                        yearTo,
                        driveType,
                        imagePath
                    },
                    true,
                    30);
                /*{
               "IsSuccess": true,
                 "Data": [
                   {
                     "productGroupNameMain": "สินค้ากลุ่มไฟฟ้า",
                     "products": [
                       {
                                           "stkcode": "0986280765",
                         "productList": "สินค้ากลุ่มเซนเซอร์"
                       },
                       {
                                           "stkcode": "0986AG1304",
                         "productList": "ชุดลูกลอยและปั้มติ้ก"
                       }
                     ]
                   },
                   {
                     "productGroupNameMain": "กรอง",
                     "products": [
                       {
                                           "stkcode": "145520-25504W",
                         "productList": "กรองแอร์"
                       }
                     ]
                   }
                 ]
               }*/
                var groupData = result.Data?.result?
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