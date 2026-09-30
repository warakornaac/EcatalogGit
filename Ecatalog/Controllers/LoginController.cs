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
using System.DirectoryServices;

namespace Ecatalog.Controllers
{
    public class LoginController : Controller
    {
        // GET: Login
        [HttpGet]
        public ActionResult Login(string returnUrl)
        {
            if (!string.IsNullOrEmpty(returnUrl))
            {
                ViewBag.ReturnUrl = returnUrl;
            }

            return View();
        }

        [HttpPost]
        public async Task<ActionResult> AuthenUser(string Username, string Password, string Latitude = "", string Longitude = "")
        {
            Boolean IsSuccess = false;
            string userAgent = Request.UserAgent ?? "";
            try
            {
                var result = await Utils.CallApiAsyncMemory<AuthenApiResponseModel>(
                    "Ecatalog/UserAuthen", "GET",
                    new
                    {
                        Username = Username,
                        Password = Password,
                        Latitude = Latitude,
                        Longitude = Longitude,
                        UserAgent = userAgent
                    }, false, 10);

                if (result == null)
                    return Json(new { IsSuccess = false, Message = "API returned null" }, JsonRequestBehavior.AllowGet);

                if (result.Data == null)
                    return Json(new
                    {
                        IsSuccess = false,
                        Message = "TEST123 API Data is null",
                        RawResult = Newtonsoft.Json.JsonConvert.SerializeObject(result)
                    }, JsonRequestBehavior.AllowGet);

                if (result.Data.result != null && result.Data.result.Count > 0)
                {
                    var user = result.Data.result.FirstOrDefault();
                    System.Diagnostics.Debug.WriteLine($"slmcode=[{user.slmcode}] cuscode=[{user.cuscode}] userType=[{user.userType}]");

                    Session["username"] = Username;
                    Session["email"] = user.email;
                    Session["slmcode"] = user.slmcode;
                    Session["cuscode"] = user.cuscode;
                    Session["isActive"] = user.isActive;
                    Session["UserType"] = user.userType.ToString(); // userType == 0 ถ้าไม่มีใน UserAuthen

                    IsSuccess = true;
                }

                return Json(new
                {
                    IsSuccess = IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result,
                    Message = result.Data.errorMessage
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { IsSuccess = false, Message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        public ActionResult Logout() {
            Session.Clear();
            Session.Abandon();
            return RedirectToAction("Login", "Login");
        }

        [HttpGet]
        public ActionResult TestAD(string u, string p)
        {
            string result = "";
            try
            {
                string ldapPath = "LDAP://ADSRV2016-01/dc=Automotive,dc=com";
                var dirEntry = new System.DirectoryServices.DirectoryEntry(ldapPath, u, p);
                var searcher = new System.DirectoryServices.DirectorySearcher(dirEntry)
                {
                    Filter = "(SAMAccountName=" + u + ")"
                };
                var found = searcher.FindOne();
                result = found != null ? "พบ user ใน AD ✓" : "Bind ได้แต่หา user ไม่เจอ";
            }
            catch (Exception ex)
            {
                result = "ERROR: " + ex.Message;
            }
            return Content(result);
        }
    }
}