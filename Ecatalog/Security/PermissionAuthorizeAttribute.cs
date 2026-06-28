using Ecatalog.Library;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace Ecatalog.Security
{
    public sealed class PermissionAuthorizeAttribute : AuthorizeAttribute
    {
        public PermissionAuthorizeAttribute(params string[] permissionCodes)
        {
            PermissionCodes = permissionCodes ?? new string[0];
        }

        public string[] PermissionCodes { get; private set; }

        protected override bool AuthorizeCore(HttpContextBase httpContext)
        {
            if (httpContext == null || !Utils.IsLogin) {
                return false;
            }

            if (PermissionCodes.Length == 0) {
                return true;
            }

            return PermissionCodes.Any(PermissionHelper.HasPermission);
        }

        protected override void HandleUnauthorizedRequest(AuthorizationContext filterContext)
        {
            if (!Utils.IsLogin) {
                filterContext.Result = new RedirectToRouteResult(
                    new System.Web.Routing.RouteValueDictionary {
                        { "controller", "Login" },
                        { "action", "Login" }
                    });
                return;
            }

            if (filterContext.HttpContext.Request.IsAjaxRequest()) {
                filterContext.Result = new JsonResult {
                    Data = new {
                        IsSuccess = false,
                        Message = "You do not have permission to perform this action."
                    },
                    JsonRequestBehavior = JsonRequestBehavior.AllowGet
                };
                filterContext.HttpContext.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                return;
            }

            filterContext.Result = new HttpStatusCodeResult(
                HttpStatusCode.Forbidden,
                "You do not have permission to perform this action.");
        }
    }
}
