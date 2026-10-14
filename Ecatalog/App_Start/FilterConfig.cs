using Ecatalog.Library;
using System.Web;
using System.Web.Mvc;
using Ecatalog.Helpers;

namespace Ecatalog
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            filters.Add(new SessionAuthorizeAttribute());
        }
    }
}
