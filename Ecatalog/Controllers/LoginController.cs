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
    public class LoginController : Controller
    {
        // GET: Login
        [HttpGet]
        public ActionResult Login() {

            return View();
        }

        [HttpPost]
        public async Task<ActionResult> AuthenUser(string Username, string Password) {
            Boolean IsSuccess = false;
            try {
                var result = await Utils.CallApiAsyncMemory<
                        AuthenApiResponseModel>(
                        "Ecatalog/UserAuthen",
                        "GET",
                        new {
                            Username = Username,
                            Password = Password
                        },
                        false,
                        10);

                if (result.Data != null &&
                    result.Data.result != null &&
                    result.Data.result.Count > 0) {
                    var user = result.Data.result.FirstOrDefault();

                    // SESSION
                    Session["username"] = Username;
                    Session["email"] = user.email;
                    Session["UserType"] = user.userType;
                    Session["slmcode"] = user.slmcode;
                    Session["cuscode"] = user.cuscode;
                    Session["userType"] = user.userType;
                    Session["isActive"] = user.isActive;
                    IsSuccess = true;
                }

                return Json(new {
                    IsSuccess = IsSuccess,
                    IsFromCache = result.IsFromCache,
                    Data = result.Data?.result,
                    Message = result.Data.errorMessage
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

        public ActionResult Logout() {
            Session.Clear();
            Session.Abandon();
            return RedirectToAction("Login", "Login");
        }
    }
}