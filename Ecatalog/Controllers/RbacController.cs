using Ecatalog.Library;
using Ecatalog.Models;
using Ecatalog.Security;
using System;
using System.Linq;
using System.Web.Mvc;

namespace Ecatalog.Controllers
{
    [PermissionAuthorize(PermissionCode.RbacManage)]
    public class RbacController : Controller
    {
        public ActionResult Index(int? roleId, string username, string message)
        {
            return View(BuildViewModel(roleId, username, message));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult SyncPermissions()
        {
            PermissionHelper.SyncPermissionCatalog(Utils.SessionUsername);
            return RedirectToAction("Index", new { message = "Permission catalog synced." });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult SaveRole([Bind(Prefix = "RoleEdit")] RbacRoleEditModel model)
        {
            model.SelectedPermissionIds = model.SelectedPermissionIds ?? new int[0].ToList();

            if (!ModelState.IsValid) {
                var vm = BuildViewModel(model.RoleId == 0 ? (int?)null : model.RoleId, null, "Please check the role form.");
                vm.RoleEdit = model;
                vm.RoleEdit.Permissions = PermissionHelper.GetPermissions();
                return View("Index", vm);
            }

            PermissionHelper.SaveRole(model, Utils.SessionUsername);
            return RedirectToAction("Index", new { roleId = model.RoleId, message = "Role saved." });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult SaveUserRoles([Bind(Prefix = "UserRoleEdit")] RbacUserRoleEditModel model)
        {
            model.SelectedRoleIds = model.SelectedRoleIds ?? new int[0].ToList();

            if (!ModelState.IsValid) {
                var vm = BuildViewModel(null, model.Username, "Username is required.");
                vm.UserRoleEdit = model;
                vm.UserRoleEdit.Roles = PermissionHelper.GetRoles();
                return View("Index", vm);
            }

            PermissionHelper.SaveUserRoles(model.Username, model.SelectedRoleIds, Utils.SessionUsername);
            return RedirectToAction("Index", new { username = model.Username, message = "User roles saved." });
        }

        private static RbacAdminViewModel BuildViewModel(int? roleId, string username, string message)
        {
            var model = new RbacAdminViewModel {
                Roles = PermissionHelper.GetRoles(),
                Permissions = PermissionHelper.GetPermissions(),
                StatusMessage = message
            };

            model.RoleEdit = roleId.HasValue
                ? PermissionHelper.GetRoleEditModel(roleId.Value)
                : new RbacRoleEditModel { Permissions = model.Permissions };

            model.UserRoleEdit = new RbacUserRoleEditModel {
                Username = username,
                Roles = model.Roles,
                SelectedRoleIds = PermissionHelper.GetUserRoleIds(username)
            };

            return model;
        }
    }
}
