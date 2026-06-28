using System.Collections.Generic;

namespace Ecatalog.Security
{
    public static class PermissionCode
    {
        public const string RbacManage = "RBAC_MANAGE";
        public const string ProductRead = "PRODUCT_READ";
        public const string ProductSearch = "PRODUCT_SEARCH";
        public const string ProductTabRead = "PRODUCT_TAB_READ";
        public const string MasterDataRead = "MASTER_DATA_READ";
        public const string CacheManage = "CACHE_MANAGE";

        public static readonly IReadOnlyList<PermissionDefinition> All =
            new List<PermissionDefinition> {
                new PermissionDefinition(RbacManage, "Manage RBAC", "Create roles and assign permissions."),
                new PermissionDefinition(ProductRead, "Read products", "View product catalog data."),
                new PermissionDefinition(ProductSearch, "Search products", "Run product search endpoints."),
                new PermissionDefinition(ProductTabRead, "Read product tabs", "View product description, spec, images, OEM, competitor, and linkage tabs."),
                new PermissionDefinition(MasterDataRead, "Read master data", "Read vehicle and product filter lookup data."),
                new PermissionDefinition(CacheManage, "Manage cache", "Inspect and manage memory cache.")
            };
    }

    public sealed class PermissionDefinition
    {
        public PermissionDefinition(string code, string name, string description)
        {
            Code = code;
            Name = name;
            Description = description;
        }

        public string Code { get; private set; }
        public string Name { get; private set; }
        public string Description { get; private set; }
    }
}
