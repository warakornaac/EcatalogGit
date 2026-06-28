using Ecatalog.Library;
using Ecatalog.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace Ecatalog.Security
{
    public static class PermissionHelper
    {
        private const string RbacConnectionKey = "RbacDB";
        private const string DefaultConnectionKey = "ECatalogDB";

        public static bool HasPermission(string permissionCode)
        {
            return HasPermission(Utils.SessionUsername, permissionCode);
        }

        public static bool HasPermission(string username, string permissionCode)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(permissionCode)) {
                return false;
            }

            if (IsAdminFallbackUser()) {
                return true;
            }

            const string sql = @"
select top (1) 1
from dbo.RBAC_UserRoles ur
inner join dbo.RBAC_Roles r on r.RoleId = ur.RoleId and r.IsActive = 1
inner join dbo.RBAC_RolePermissions rp on rp.RoleId = r.RoleId
inner join dbo.RBAC_Permissions p on p.PermissionId = rp.PermissionId and p.IsActive = 1
where ur.Username = @Username
  and p.PermissionCode = @PermissionCode;";

            try {
                using (var conn = CreateConnection())
                using (var cmd = new SqlCommand(sql, conn)) {
                    cmd.Parameters.Add("@Username", SqlDbType.NVarChar, 100).Value = username;
                    cmd.Parameters.Add("@PermissionCode", SqlDbType.NVarChar, 100).Value = permissionCode;
                    conn.Open();
                    return cmd.ExecuteScalar() != null;
                }
            }
            catch (SqlException) {
                return false;
            }
        }

        public static bool HasAnyPermission(params string[] permissionCodes)
        {
            if (permissionCodes == null || permissionCodes.Length == 0) {
                return Utils.IsLogin;
            }

            return permissionCodes.Any(HasPermission);
        }

        public static bool IsAdminFallbackUser()
        {
            var session = HttpContext.Current == null ? null : HttpContext.Current.Session;
            if (session == null) {
                return false;
            }

            var userType = Convert.ToString(session["userType"] ?? session["UserType"]);
            return string.Equals(userType, "Admin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(userType, "Administrator", StringComparison.OrdinalIgnoreCase)
                || string.Equals(userType, "SuperAdmin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(userType, "SUPERADMIN", StringComparison.OrdinalIgnoreCase);
        }

        public static IList<RbacPermissionModel> GetPermissions()
        {
            const string sql = @"
select PermissionId, PermissionCode, PermissionName, Description, IsActive
from dbo.RBAC_Permissions
order by PermissionCode;";

            var permissions = new List<RbacPermissionModel>();
            using (var conn = CreateConnection())
            using (var cmd = new SqlCommand(sql, conn)) {
                conn.Open();
                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        permissions.Add(new RbacPermissionModel {
                            PermissionId = reader.GetInt32(0),
                            PermissionCode = reader.GetString(1),
                            PermissionName = reader.GetString(2),
                            Description = reader.IsDBNull(3) ? "" : reader.GetString(3),
                            IsActive = reader.GetBoolean(4)
                        });
                    }
                }
            }
            return permissions;
        }

        public static IList<RbacRoleModel> GetRoles()
        {
            const string sql = @"
select RoleId, RoleName, Description, IsActive
from dbo.RBAC_Roles
order by RoleName;";

            var roles = new List<RbacRoleModel>();
            using (var conn = CreateConnection())
            using (var cmd = new SqlCommand(sql, conn)) {
                conn.Open();
                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        roles.Add(new RbacRoleModel {
                            RoleId = reader.GetInt32(0),
                            RoleName = reader.GetString(1),
                            Description = reader.IsDBNull(2) ? "" : reader.GetString(2),
                            IsActive = reader.GetBoolean(3)
                        });
                    }
                }
            }
            return roles;
        }

        public static RbacRoleEditModel GetRoleEditModel(int roleId)
        {
            var roles = GetRoles();
            var role = roles.FirstOrDefault(x => x.RoleId == roleId) ?? new RbacRoleModel();
            var permissions = GetPermissions();
            var selected = GetRolePermissionIds(roleId);

            return new RbacRoleEditModel {
                RoleId = role.RoleId,
                RoleName = role.RoleName,
                Description = role.Description,
                IsActive = role.IsActive,
                Permissions = permissions,
                SelectedPermissionIds = selected
            };
        }

        public static IList<int> GetRolePermissionIds(int roleId)
        {
            const string sql = "select PermissionId from dbo.RBAC_RolePermissions where RoleId = @RoleId;";
            var ids = new List<int>();
            using (var conn = CreateConnection())
            using (var cmd = new SqlCommand(sql, conn)) {
                cmd.Parameters.Add("@RoleId", SqlDbType.Int).Value = roleId;
                conn.Open();
                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        ids.Add(reader.GetInt32(0));
                    }
                }
            }
            return ids;
        }

        public static IList<string> GetUserRoles(string username)
        {
            const string sql = @"
select r.RoleName
from dbo.RBAC_UserRoles ur
inner join dbo.RBAC_Roles r on r.RoleId = ur.RoleId
where ur.Username = @Username
order by r.RoleName;";

            var roles = new List<string>();
            if (string.IsNullOrWhiteSpace(username)) {
                return roles;
            }

            using (var conn = CreateConnection())
            using (var cmd = new SqlCommand(sql, conn)) {
                cmd.Parameters.Add("@Username", SqlDbType.NVarChar, 100).Value = username;
                conn.Open();
                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        roles.Add(reader.GetString(0));
                    }
                }
            }
            return roles;
        }

        public static IList<int> GetUserRoleIds(string username)
        {
            const string sql = "select RoleId from dbo.RBAC_UserRoles where Username = @Username;";
            var ids = new List<int>();
            if (string.IsNullOrWhiteSpace(username)) {
                return ids;
            }

            using (var conn = CreateConnection())
            using (var cmd = new SqlCommand(sql, conn)) {
                cmd.Parameters.Add("@Username", SqlDbType.NVarChar, 100).Value = username;
                conn.Open();
                using (var reader = cmd.ExecuteReader()) {
                    while (reader.Read()) {
                        ids.Add(reader.GetInt32(0));
                    }
                }
            }
            return ids;
        }

        public static void SaveRole(RbacRoleEditModel model, string updatedBy)
        {
            if (model == null) {
                throw new ArgumentNullException("model");
            }

            using (var conn = CreateConnection())
            using (var cmd = conn.CreateCommand()) {
                conn.Open();
                using (var tx = conn.BeginTransaction()) {
                    cmd.Transaction = tx;

                    if (model.RoleId == 0) {
                        cmd.CommandText = @"
insert into dbo.RBAC_Roles (RoleName, Description, IsActive, CreatedBy, UpdatedBy)
values (@RoleName, @Description, @IsActive, @UpdatedBy, @UpdatedBy);
select cast(scope_identity() as int);";
                        AddRoleParameters(cmd, model, updatedBy);
                        model.RoleId = Convert.ToInt32(cmd.ExecuteScalar());
                    }
                    else {
                        cmd.CommandText = @"
update dbo.RBAC_Roles
set RoleName = @RoleName,
    Description = @Description,
    IsActive = @IsActive,
    UpdatedBy = @UpdatedBy,
    UpdatedDate = getdate()
where RoleId = @RoleId;";
                        AddRoleParameters(cmd, model, updatedBy);
                        cmd.Parameters.Add("@RoleId", SqlDbType.Int).Value = model.RoleId;
                        cmd.ExecuteNonQuery();
                    }

                    cmd.Parameters.Clear();
                    cmd.CommandText = "delete from dbo.RBAC_RolePermissions where RoleId = @RoleId;";
                    cmd.Parameters.Add("@RoleId", SqlDbType.Int).Value = model.RoleId;
                    cmd.ExecuteNonQuery();

                    foreach (var permissionId in model.SelectedPermissionIds ?? new List<int>()) {
                        cmd.Parameters.Clear();
                        cmd.CommandText = @"
insert into dbo.RBAC_RolePermissions (RoleId, PermissionId, CreatedBy)
values (@RoleId, @PermissionId, @UpdatedBy);";
                        cmd.Parameters.Add("@RoleId", SqlDbType.Int).Value = model.RoleId;
                        cmd.Parameters.Add("@PermissionId", SqlDbType.Int).Value = permissionId;
                        cmd.Parameters.Add("@UpdatedBy", SqlDbType.NVarChar, 100).Value = (object)updatedBy ?? DBNull.Value;
                        cmd.ExecuteNonQuery();
                    }

                    tx.Commit();
                }
            }
        }

        public static void SaveUserRoles(string username, IList<int> roleIds, string updatedBy)
        {
            if (string.IsNullOrWhiteSpace(username)) {
                throw new ArgumentException("Username is required.", "username");
            }

            using (var conn = CreateConnection())
            using (var cmd = conn.CreateCommand()) {
                conn.Open();
                using (var tx = conn.BeginTransaction()) {
                    cmd.Transaction = tx;
                    cmd.CommandText = "delete from dbo.RBAC_UserRoles where Username = @Username;";
                    cmd.Parameters.Add("@Username", SqlDbType.NVarChar, 100).Value = username.Trim();
                    cmd.ExecuteNonQuery();

                    foreach (var roleId in roleIds ?? new List<int>()) {
                        cmd.Parameters.Clear();
                        cmd.CommandText = @"
insert into dbo.RBAC_UserRoles (Username, RoleId, CreatedBy)
values (@Username, @RoleId, @UpdatedBy);";
                        cmd.Parameters.Add("@Username", SqlDbType.NVarChar, 100).Value = username.Trim();
                        cmd.Parameters.Add("@RoleId", SqlDbType.Int).Value = roleId;
                        cmd.Parameters.Add("@UpdatedBy", SqlDbType.NVarChar, 100).Value = (object)updatedBy ?? DBNull.Value;
                        cmd.ExecuteNonQuery();
                    }

                    tx.Commit();
                }
            }
        }

        public static void SyncPermissionCatalog(string updatedBy)
        {
            using (var conn = CreateConnection())
            using (var cmd = conn.CreateCommand()) {
                conn.Open();
                foreach (var permission in PermissionCode.All) {
                    cmd.Parameters.Clear();
                    cmd.CommandText = @"
if exists (select 1 from dbo.RBAC_Permissions where PermissionCode = @PermissionCode)
begin
    update dbo.RBAC_Permissions
    set PermissionName = @PermissionName,
        Description = @Description,
        IsActive = 1,
        UpdatedBy = @UpdatedBy,
        UpdatedDate = getdate()
    where PermissionCode = @PermissionCode;
end
else
begin
    insert into dbo.RBAC_Permissions (PermissionCode, PermissionName, Description, IsActive, CreatedBy, UpdatedBy)
    values (@PermissionCode, @PermissionName, @Description, 1, @UpdatedBy, @UpdatedBy);
end";
                    cmd.Parameters.Add("@PermissionCode", SqlDbType.NVarChar, 100).Value = permission.Code;
                    cmd.Parameters.Add("@PermissionName", SqlDbType.NVarChar, 200).Value = permission.Name;
                    cmd.Parameters.Add("@Description", SqlDbType.NVarChar, 500).Value = permission.Description;
                    cmd.Parameters.Add("@UpdatedBy", SqlDbType.NVarChar, 100).Value = (object)updatedBy ?? DBNull.Value;
                    cmd.ExecuteNonQuery();
                }
            }
        }

        private static void AddRoleParameters(SqlCommand cmd, RbacRoleEditModel model, string updatedBy)
        {
            cmd.Parameters.Clear();
            cmd.Parameters.Add("@RoleName", SqlDbType.NVarChar, 100).Value = model.RoleName.Trim();
            cmd.Parameters.Add("@Description", SqlDbType.NVarChar, 500).Value = (object)model.Description ?? DBNull.Value;
            cmd.Parameters.Add("@IsActive", SqlDbType.Bit).Value = model.IsActive;
            cmd.Parameters.Add("@UpdatedBy", SqlDbType.NVarChar, 100).Value = (object)updatedBy ?? DBNull.Value;
        }

        private static SqlConnection CreateConnection()
        {
            return new SqlConnection(GetConnectionString());
        }

        private static string GetConnectionString()
        {
            var rbac = ConfigurationManager.AppSettings[RbacConnectionKey];
            if (!string.IsNullOrWhiteSpace(rbac)) {
                return rbac;
            }
            return Utils.GetConfig(DefaultConnectionKey);
        }
    }
}
