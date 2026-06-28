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
        /*
         * Function name / test example usage:
         *
         * GET  /Product/GetProductBySearchVio?marketSegmentId=&segmentId=&makerId=&rangeId=&bodyId=&engineId=&yearFrom=&yearTo=&driveType=&imagePath=
         * POST /Product/GetProductBySearchCatagory
         *      Body: { "marketSegmentId": "", "segmentId": "", "makerId": "", "rangeId": "", "bodyId": "", "engineId": "", "yearFrom": "", "yearTo": "", "driveType": "", "imagePath": "" }
         *
         * GET  /Product/GetTabItemCountProduct?stkcode=0986280765
         * GET  /Product/GetTabDescription?stkcode=0986280765
         * GET  /Product/GetTabSpec?stkcode=0986280765
         * GET  /Product/GetTabImage?stkcode=0986280765
         * GET  /Product/GetTabOem?stkcode=0986280765
         * GET  /Product/GetTabCompetitor?stkcode=0986280765
         * GET  /Product/GetTabLinkage?stkcode=0986280765
         */
        // GET: Product
        public async Task<ActionResult> GetProductBySearchVio(string marketSegmentId, string segmentId, string makerId, string rangeId, string bodyId, string engineId, string yearFrom, string yearTo, string driveType, string imagePath)
        {
            try
            {
                var result = await Utils.CallApiAsyncMemory<
                    ProductSearchVioModel>(
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
                    .Select(g => new
                    {
                        productGroupNameMain = g.Key,
                        productList = g.ToList()
                    })
                    .ToList();

                return Json(new
                {
                    IsSuccess = result.IsSuccess,
                    IsFromCache = result.IsFromCache,
                    ExecutionTime = result.ExecutionTime,
                    Data = groupData //result.Data?.result
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
        public async Task<ActionResult> GetProductBySearchCatagory(ProductSearchCatagoryRequestModel request) {
            try {
                var result =
                    await Utils.CallApiAsyncMemory<
                        ProductSearchVioModel>(
                        "Ecatalog/GetProductBySearchCatagory",
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

    }
}
