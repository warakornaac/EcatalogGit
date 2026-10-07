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

                bool isNoPermission = false;
                string failReason = "Invalid Username or Password";

                if (result.Data.result != null && result.Data.result.Count > 0)
                {
                    var user = result.Data.result.FirstOrDefault();
                    System.Diagnostics.Debug.WriteLine($"slmcode=[{user.slmcode}] cuscode=[{user.cuscode}] userType=[{user.userType}]");

                    // UserType = 0 → ไม่มีสิทธิ์เข้าใช้งาน (ไม่ set Session)
                    if (user.userType.ToString() == "0")
                    {
                        isNoPermission = true;
                        failReason = "No permission (UserType = 0)";
                        Session.Clear();
                    }
                    else
                    {
                        Session["username"] = Username;
                        Session["email"] = user.email;
                        Session["slmcode"] = user.slmcode;
                        Session["cuscode"] = user.cuscode;
                        Session["isActive"] = user.isActive;
                        Session["UserType"] = user.userType.ToString();

                        IsSuccess = true;
                    }
                }

                InsertLoginLog(Username: Username, flag: "internal",
                    loginStatus: IsSuccess ? "SUCCESS" : "FAIL",
                    failReason: IsSuccess ? null : failReason);

                return Json(new
                {
                    IsSuccess = IsSuccess,
                    IsNoPermission = isNoPermission,
                    IsFromCache = result.IsFromCache,
                    // ไม่ส่งข้อมูล user กลับไปถ้าถูกบล็อก
                    Data = IsSuccess ? result.Data?.result : null,
                    Message = isNoPermission
                        ? "ไม่มีสิทธิ์เข้าใช้งาน\nกรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึง"
                        : result.Data.errorMessage
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                InsertLoginLog(Username: Username, flag: "internal", loginStatus: "FAIL" ,failReason:ex.Message);
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
        [NonAction]
        public async Task InsertLoginLog
            (
            string Username,
            string flag,
            string loginStatus,
            string failReason = null
            )
        {
            //string username = Session["username"].ToString();
            string UserType = Session["UserType"]?.ToString() ?? "0";
            string userAgent = Request.UserAgent;
            var userHostAddress = Request.UserHostAddress;
            if (!string.IsNullOrEmpty(userAgent) && userAgent.Length > 500)
                userAgent = userAgent.Substring(0, 500);
            try
            {
                if (!string.IsNullOrEmpty(userAgent) && userAgent.Length > 500)
                    userAgent = userAgent.Substring(0, 500);
                var result = await Utils.CallApiAsyncMemory<InsertLogAuthenLogin>(
                    $"Ecatalog/InsertLoginLog?usrId={Username}&usrTyp={UserType}&flag={flag}&userHostAddress={userHostAddress}&loginStatus={loginStatus}&failReason={failReason}&userAgent=E-Catalog",
                    "POST",
                    null,
                    false,
                    10);

                if (result.StatusCode != 200)
                {
                    //ResponseString = result.Data?.errorMessage ?? "เกิดข้อผิดพลาดจาก API";
                    Console.WriteLine(result.Data?.errorMessage ?? "เกิดข้อผิดพลาดจาก API");
                }
                else
                {
                    Console.WriteLine("Log Inserted");

                }
            }
            catch(Exception ex) { Console.WriteLine("Error:" + ex.Message); }
        }
    }
}