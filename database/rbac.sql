set ansi_nulls on;
set quoted_identifier on;
go

if object_id('dbo.RBAC_Roles', 'U') is null
begin
    create table dbo.RBAC_Roles (
        RoleId int identity(1,1) not null constraint PK_RBAC_Roles primary key,
        RoleName nvarchar(100) not null,
        Description nvarchar(500) null,
        IsActive bit not null constraint DF_RBAC_Roles_IsActive default (1),
        CreatedBy nvarchar(100) null,
        CreatedDate datetime not null constraint DF_RBAC_Roles_CreatedDate default (getdate()),
        UpdatedBy nvarchar(100) null,
        UpdatedDate datetime not null constraint DF_RBAC_Roles_UpdatedDate default (getdate())
    );

    create unique index UX_RBAC_Roles_RoleName on dbo.RBAC_Roles (RoleName);
end
go

if object_id('dbo.RBAC_Permissions', 'U') is null
begin
    create table dbo.RBAC_Permissions (
        PermissionId int identity(1,1) not null constraint PK_RBAC_Permissions primary key,
        PermissionCode nvarchar(100) not null,
        PermissionName nvarchar(200) not null,
        Description nvarchar(500) null,
        IsActive bit not null constraint DF_RBAC_Permissions_IsActive default (1),
        CreatedBy nvarchar(100) null,
        CreatedDate datetime not null constraint DF_RBAC_Permissions_CreatedDate default (getdate()),
        UpdatedBy nvarchar(100) null,
        UpdatedDate datetime not null constraint DF_RBAC_Permissions_UpdatedDate default (getdate())
    );

    create unique index UX_RBAC_Permissions_PermissionCode on dbo.RBAC_Permissions (PermissionCode);
end
go

if object_id('dbo.RBAC_UserRoles', 'U') is null
begin
    create table dbo.RBAC_UserRoles (
        Username nvarchar(100) not null,
        RoleId int not null,
        CreatedBy nvarchar(100) null,
        CreatedDate datetime not null constraint DF_RBAC_UserRoles_CreatedDate default (getdate()),
        constraint PK_RBAC_UserRoles primary key (Username, RoleId)
    );
end
go

if object_id('dbo.RBAC_RolePermissions', 'U') is null
begin
    create table dbo.RBAC_RolePermissions (
        RoleId int not null,
        PermissionId int not null,
        CreatedBy nvarchar(100) null,
        CreatedDate datetime not null constraint DF_RBAC_RolePermissions_CreatedDate default (getdate()),
        constraint PK_RBAC_RolePermissions primary key (RoleId, PermissionId)
    );
end
go

if not exists (select 1 from sys.foreign_keys where name = 'FK_RBAC_UserRoles_Roles')
begin
    alter table dbo.RBAC_UserRoles
    add constraint FK_RBAC_UserRoles_Roles foreign key (RoleId)
    references dbo.RBAC_Roles (RoleId);
end
go

if not exists (select 1 from sys.foreign_keys where name = 'FK_RBAC_RolePermissions_Roles')
begin
    alter table dbo.RBAC_RolePermissions
    add constraint FK_RBAC_RolePermissions_Roles foreign key (RoleId)
    references dbo.RBAC_Roles (RoleId);
end
go

if not exists (select 1 from sys.foreign_keys where name = 'FK_RBAC_RolePermissions_Permissions')
begin
    alter table dbo.RBAC_RolePermissions
    add constraint FK_RBAC_RolePermissions_Permissions foreign key (PermissionId)
    references dbo.RBAC_Permissions (PermissionId);
end
go

merge dbo.RBAC_Permissions as target
using (values
    ('RBAC_MANAGE', 'Manage RBAC', 'Create roles and assign permissions.'),
    ('PRODUCT_READ', 'Read products', 'View product catalog data.'),
    ('PRODUCT_SEARCH', 'Search products', 'Run product search endpoints.'),
    ('PRODUCT_TAB_READ', 'Read product tabs', 'View product detail tab data.'),
    ('MASTER_DATA_READ', 'Read master data', 'Read vehicle and product lookup data.'),
    ('CACHE_MANAGE', 'Manage cache', 'Inspect and manage memory cache.')
) as source (PermissionCode, PermissionName, Description)
on target.PermissionCode = source.PermissionCode
when matched then
    update set PermissionName = source.PermissionName,
               Description = source.Description,
               IsActive = 1,
               UpdatedDate = getdate()
when not matched then
    insert (PermissionCode, PermissionName, Description, IsActive, CreatedBy, UpdatedBy)
    values (source.PermissionCode, source.PermissionName, source.Description, 1, 'seed', 'seed');
go

if not exists (select 1 from dbo.RBAC_Roles where RoleName = 'RBAC Administrators')
begin
    insert into dbo.RBAC_Roles (RoleName, Description, CreatedBy, UpdatedBy)
    values ('RBAC Administrators', 'Can manage roles, permissions, and user role assignments.', 'seed', 'seed');
end
go

insert into dbo.RBAC_RolePermissions (RoleId, PermissionId, CreatedBy)
select r.RoleId, p.PermissionId, 'seed'
from dbo.RBAC_Roles r
cross join dbo.RBAC_Permissions p
where r.RoleName = 'RBAC Administrators'
  and p.PermissionCode = 'RBAC_MANAGE'
  and not exists (
      select 1
      from dbo.RBAC_RolePermissions rp
      where rp.RoleId = r.RoleId and rp.PermissionId = p.PermissionId
  );
go

-- Bootstrap one user after running this script:
-- insert into dbo.RBAC_UserRoles (Username, RoleId, CreatedBy)
-- select 'your.login.username', RoleId, 'seed'
-- from dbo.RBAC_Roles
-- where RoleName = 'RBAC Administrators';
