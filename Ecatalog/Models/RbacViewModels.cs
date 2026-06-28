using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Ecatalog.Models
{
    public class RbacPermissionModel
    {
        public int PermissionId { get; set; }
        public string PermissionCode { get; set; }
        public string PermissionName { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class RbacRoleModel
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class RbacRoleEditModel
    {
        public int RoleId { get; set; }

        [Required]
        [StringLength(100)]
        public string RoleName { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        public bool IsActive { get; set; }
        public IList<RbacPermissionModel> Permissions { get; set; }
        public IList<int> SelectedPermissionIds { get; set; }

        public RbacRoleEditModel()
        {
            IsActive = true;
            Permissions = new List<RbacPermissionModel>();
            SelectedPermissionIds = new List<int>();
        }
    }

    public class RbacUserRoleEditModel
    {
        [Required]
        [StringLength(100)]
        public string Username { get; set; }

        public IList<RbacRoleModel> Roles { get; set; }
        public IList<int> SelectedRoleIds { get; set; }

        public RbacUserRoleEditModel()
        {
            Roles = new List<RbacRoleModel>();
            SelectedRoleIds = new List<int>();
        }
    }

    public class RbacAdminViewModel
    {
        public IList<RbacRoleModel> Roles { get; set; }
        public IList<RbacPermissionModel> Permissions { get; set; }
        public RbacRoleEditModel RoleEdit { get; set; }
        public RbacUserRoleEditModel UserRoleEdit { get; set; }
        public string StatusMessage { get; set; }

        public RbacAdminViewModel()
        {
            Roles = new List<RbacRoleModel>();
            Permissions = new List<RbacPermissionModel>();
            RoleEdit = new RbacRoleEditModel();
            UserRoleEdit = new RbacUserRoleEditModel();
        }
    }
}
