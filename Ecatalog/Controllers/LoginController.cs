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
            //if (this.Session["UserType"] == null)
            //    this.Session["UserType"] = "";

            return View();
        }

        [HttpPost]
        public async Task<ActionResult> AuthenUser(string Username, string Password) {
            try {
                var result = await Utils.CallApiAsyncMemory<
                        AuthenApiResponseModel>(
                        "UserAuthenEcatalog",
                        "GET",
                        new {
                            Username = Username,
                            Password = Password
                        },
                        false,
                        10);

                if (result.IsSuccess &&
                    result.Data != null &&
                    result.Data.result != null &&
                    result.Data.result.Count > 0) {
                    var user =
                        result.Data.result.FirstOrDefault();

                    // SESSION
                    Session["username"] = Username;
                    Session["email"] = user.email;
                    Session["UserType"] = user.userType;
                    Session["slmcode"] = user.slmcode;
                    Session["cuscode"] = user.cuscode;
                    Session["userType"] = user.userType;
                    Session["isActive"] = user.isActive;

                    //Session["CurrentUser"] = new UserSessionModel {
                    //    verify = user.verify,
                    //    username = Username,
                    //    email = user.email,
                    //    slmcode = user.slmcode,
                    //    cuscode = user.cuscode,
                    //    userType = user.userType,
                    //    isActive = user.isActive
                    //};
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

        //[HttpPost]
        //public ActionResult Login(string User, string Password)
        //{
        //    if (string.IsNullOrWhiteSpace(User) || string.IsNullOrWhiteSpace(Password))
        //    {
        //        ModelState.AddModelError("", "Please enter username and password.");
        //        return View();
        //    }

        //    string userTrim = User.Trim();
        //    string passTrim = Password.Trim();
        //    string UserType = string.Empty;

        //    var connectionString = ConfigurationManager.ConnectionStrings["ServiceCatalogDB"].ConnectionString;

        //    try // ✅ Case 1: Login ผ่าน AD ได้
        //    {
        //        DirectoryEntry entry = new DirectoryEntry(
        //            "LDAP://ADSRV2016-01/dc=Automotive,dc=com", userTrim, passTrim);
        //        DirectorySearcher search = new DirectorySearcher(entry);
        //        search.Filter = "(SAMAccountName=" + userTrim + ")";
        //        search.PropertiesToLoad.Add("cn");
        //        search.PropertiesToLoad.Add("department");

        //        SearchResult result = search.FindOne();

        //        if (result == null)
        //        {
        //            ModelState.AddModelError("", "Login details are wrong.");
        //            return View();
        //        }

        //        using (SqlConnection conn = new SqlConnection(connectionString))
        //        {
        //            conn.Open();

        //            // ✅ JOIN UsrTbl + v_ADUser เช็คว่ามี User ใน AD และ UsrTbl
        //            string sql = @"SELECT Usr.UserType, Usr.Slmcod,
        //                                  Ad.Department, Ad.Company,
        //                                  Ad.FName, Ad.LName, Ad.mail,
        //                                  Ad.Position, Ad.EmpID
        //                           FROM UsrTbl Usr
        //                           INNER JOIN [LIP].[dbo].[v_ADUser] Ad 
        //                                  ON Ad.LogInName = Usr.UserID
        //                           WHERE Usr.UserID = @inUser
        //                           AND Usr.Password IS NULL";

        //            using (SqlCommand cmd = new SqlCommand(sql, conn))
        //            {
        //                cmd.Parameters.AddWithValue("@inUser", userTrim);

        //                using (SqlDataReader reader = cmd.ExecuteReader())
        //                {
        //                    if (reader.HasRows) // ✅ มีใน UsrTbl และ v_ADUser
        //                    {
        //                        while (reader.Read())
        //                        {
        //                            this.Session["UserAD"] = "YES";
        //                            this.Session["UserID"] = userTrim;
        //                            this.Session["UserType"] = reader["UserType"].ToString();
        //                            this.Session["Department"] = reader["Department"].ToString();
        //                            this.Session["Company"] = reader["Company"].ToString();
        //                            this.Session["SLMCOD"] = reader["Slmcod"].ToString();
        //                            this.Session["FName"] = reader["FName"].ToString();
        //                            this.Session["LName"] = reader["LName"].ToString();
        //                            this.Session["Email"] = reader["mail"].ToString();
        //                            this.Session["Position"] = reader["Position"].ToString();
        //                            this.Session["EmpID"] = reader["EmpID"].ToString();
        //                            UserType = reader["UserType"].ToString();
        //                        }
        //                    }
        //                    else // ✅ ไม่มีใน UsrTbl — เช็ค Department จาก AD โดยตรง
        //                    {
        //                        reader.Close();

        //                        string sqlAd = @"SELECT Department 
        //                                         FROM [LIP].[dbo].[v_ADUser] 
        //                                         WHERE LogInName = @inUser";

        //                        using (SqlCommand cmdAd = new SqlCommand(sqlAd, conn))
        //                        {
        //                            cmdAd.Parameters.AddWithValue("@inUser", userTrim);

        //                            using (SqlDataReader readerAd = cmdAd.ExecuteReader())
        //                            {
        //                                if (readerAd.HasRows && readerAd.Read())
        //                                {
        //                                    string dept = readerAd["Department"].ToString();

        //                                    if (dept == "MIS")
        //                                    {
        //                                        this.Session["UserAD"] = "YES";
        //                                        this.Session["UserID"] = userTrim;
        //                                        this.Session["UserType"] = "1"; // MIS = Admin
        //                                        this.Session["Department"] = dept;
        //                                        UserType = "1";
        //                                    }
        //                                    else
        //                                    {
        //                                        ModelState.AddModelError("",
        //                                            "You don't have permission, Please contact admin.");
        //                                        return View();
        //                                    }
        //                                }
        //                                else
        //                                {
        //                                    ModelState.AddModelError("", "Login details are wrong.");
        //                                    return View();
        //                                }
        //                            }
        //                        }
        //                    }
        //                }
        //            }
        //        }

        //        return RedirectByUserType(UserType);
        //    }
        //    catch (COMException) // ✅ Case 2: ไม่มีใน AD — เช็คจาก UsrTbl + v_ADUser
        //    {
        //        using (SqlConnection conn = new SqlConnection(connectionString))
        //        {
        //            conn.Open();
        //            string sql = @"SELECT Usr.UserType, Usr.Slmcod,
        //              Ad.Department, Ad.Company,
        //              Ad.FName, Ad.LName, Ad.mail,
        //              Ad.Position, Ad.EmpID
        //       FROM UsrTbl Usr
        //       LEFT JOIN [dbo].[v_ADUser] Ad 
        //              ON Ad.LogInName = Usr.UserID
        //       WHERE Usr.UserID = @inUser
        //       AND [dbo].F_decrypt(Usr.[Password]) = @inPassword";

        //            using (SqlCommand cmd = new SqlCommand(sql, conn))
        //            {
        //                cmd.Parameters.AddWithValue("@inUser", userTrim);
        //                cmd.Parameters.AddWithValue("@inPassword", passTrim);

        //                try
        //                {
        //                    using (SqlDataReader reader = cmd.ExecuteReader())
        //                    {
        //                        if (reader.HasRows)
        //                        {
        //                            while (reader.Read())
        //                            {
        //                                this.Session["UserAD"] = "NO";
        //                                this.Session["UserID"] = userTrim;
        //                                this.Session["UserType"] = reader["UserType"].ToString();
        //                                this.Session["Department"] = reader["Department"].ToString();
        //                                this.Session["Company"] = reader["Company"].ToString();
        //                                this.Session["SLMCOD"] = reader["Slmcod"].ToString();
        //                                this.Session["FName"] = reader["FName"].ToString();
        //                                this.Session["LName"] = reader["LName"].ToString();
        //                                this.Session["Email"] = reader["mail"].ToString();
        //                                this.Session["Position"] = reader["Position"].ToString();
        //                                this.Session["EmpID"] = reader["EmpID"].ToString();
        //                                UserType = reader["UserType"].ToString();
        //                            }
        //                        }
        //                        else
        //                        {
        //                            ModelState.AddModelError("", "Login details are wrong.");
        //                            return View();
        //                        }
        //                    }
        //                }
        //                catch (SqlException)
        //                {
        //                    ModelState.AddModelError("", "Login details are wrong.");
        //                    return View();
        //                }
        //            }
        //        }

        //        return RedirectByUserType(UserType);
        //    }
        //    catch (Exception)
        //    {
        //        ModelState.AddModelError("", "An error occurred. Please try again.");
        //        return View();
        //    }
        //}

        //private ActionResult RedirectByUserType(string userType)
        //{
        //    if (userType == "1" || userType == "2" || userType == "3")
        //    {
        //        FormsAuthentication.SetAuthCookie(
        //            this.Session["UserID"].ToString(), false);
        //        return RedirectToAction("Index", "Home");
        //    }

        //    ModelState.AddModelError("", "You don't have permission, Please contact admin.");
        //    return View("Login");
        //}

        public ActionResult Logout() {
            Session.Clear();
            Session.Abandon();
            return RedirectToAction("Login", "Login");
        }
    }
}