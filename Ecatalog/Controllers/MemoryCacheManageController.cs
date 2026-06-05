using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Ecatalog.Library.Services;
using System.Diagnostics;
using System.Runtime.Caching;
using Newtonsoft.Json;
using System.Text;

namespace Ecatalog.Controllers
{
    public class MemoryCacheManageController : Controller
    {
        // GET: MemoryCacheManage
        public ActionResult Index() {
            return View();
        }
        //get data cach ดูว่าตอนนี้
        public ActionResult GetTransactionCacheAll() {
            try {
                MemoryCacheService cache = new MemoryCacheService();

                var data = cache.GetAllCache();

                var json = Json(data, JsonRequestBehavior.AllowGet);

                json.MaxJsonLength = int.MaxValue;

                return json;
            }
            catch (Exception ex) {
                return Json(new {
                    IsSuccess = false,
                    Message = ex.Message
                },
                JsonRequestBehavior.AllowGet);
            }
        }
        //ดู Memory ที่ IIS Process ใช้อยู่
        public ActionResult MemoryInfo() {
            Process p = Process.GetCurrentProcess();
            return Json(new {
                WorkingSetMB = p.WorkingSet64 / 1024 / 1024,
                PrivateMemoryMB = p.PrivateMemorySize64 / 1024 / 1024,

                VirtualMemoryMB = p.VirtualMemorySize64 / 1024 / 1024
            },
            JsonRequestBehavior.AllowGet);
        }
        //ดูขนาด Cache โดยประมาณ
        public object GetCacheStatistics() {
            long totalBytes = 0;

            foreach (var item in MemoryCache.Default) {
                try {
                    string json = JsonConvert.SerializeObject(item.Value);

                    totalBytes += Encoding.UTF8.GetByteCount(json);
                }
                catch {
                }
            }

            return new {
                Count =
                    MemoryCache.Default.GetCount(),

                TotalKB =
                    totalBytes / 1024,

                TotalMB =
                    Math.Round(
                        totalBytes / 1024.0 / 1024.0,
                        2)
            };
        }
    }
}