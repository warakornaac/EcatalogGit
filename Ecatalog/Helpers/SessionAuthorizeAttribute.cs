using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Ecatalog.Library
{
    public class SessionAuthorizeAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext ctx)
        {
            // ข้าม action/controller ที่ติด [AllowAnonymous] (เช่น Login)
            bool skip =
                ctx.ActionDescriptor.IsDefined(typeof(AllowAnonymousAttribute), true) ||
                ctx.ActionDescriptor.ControllerDescriptor.IsDefined(typeof(AllowAnonymousAttribute), true);
            if (skip) return;

            if (ctx.HttpContext.Session["username"] != null) return;

            var req = ctx.HttpContext.Request;
            var res = ctx.HttpContext.Response;

            if (req.IsAjaxRequest())
            {
                res.StatusCode = 401;
                res.TrySkipIisCustomErrors = true;
                ctx.Result = new JsonResult
                {
                    Data = new
                    {
                        IsSuccess = false,
                        IsSessionExpired = true,
                        Message = "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่"
                    },
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
            }
            else
            {
                // เปิดหน้าตรงๆ แล้ว session หมด → ไปหน้า Login
                ctx.Result = new RedirectToRouteResult(
                    new System.Web.Routing.RouteValueDictionary(
                        new { controller = "Login", action = "Login", returnUrl = req.RawUrl }));
            }
        }
    }
}