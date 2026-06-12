using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Ecatalog.Library;

namespace Ecatalog.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            if (!Utils.IsLogin) {
                return RedirectToAction(
                    "Index",
                    "Login");
            }
            var currentYear = DateTime.Now.Year;
            ViewBag.UserType = Utils.SessionUserType;
            ViewBag.Email = Utils.SessionEmail;
            ViewBag.Account = Utils.SessionUsername;
            return View();
            
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}