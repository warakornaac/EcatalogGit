# Ecatalog Architecture

## Overview

This repository contains a classic ASP.NET MVC 5 application targeting .NET Framework 4.7.2. The application acts primarily as a web front end and backend-for-frontend layer for an external Ecatalog API service.

The MVC web project renders the login and product search experience, exposes JSON endpoints to the browser, and delegates most business/data retrieval work to an API gateway in `Ecatalog.Library`.

## Solution Structure

```text
Ecatalog.sln
├── Ecatalog/            ASP.NET MVC web application
├── Ecatalog.Library/    Shared utilities, API gateway, cache, logging
├── Ecatalog.Models/     DTOs for API requests/responses and UI data
├── Ecatalog.Data/       Placeholder/intended data layer; currently unused
└── packages/            NuGet packages restored in packages.config style
```

### Ecatalog

`Ecatalog` is the main web application. It contains:

- MVC controllers in `Controllers/`
- Razor views in `Views/`
- partial views for the main product UI in `Views/Parts/`
- JavaScript files in `Scripts/`
- CSS, fonts, and images in `Content/`, `fonts/`, and `Images/`
- application startup configuration in `Global.asax.cs` and `App_Start/`
- runtime configuration in `Web.config`

The web project references:

- `Ecatalog.Library`
- `Ecatalog.Models`

### Ecatalog.Library

`Ecatalog.Library` contains cross-cutting application services:

- `Utils`: session helpers, conversion helpers, app setting lookup, and API helper methods.
- `ApiGatewayService`: central HTTP client wrapper for external API calls.
- `MemoryCacheService`: in-process API response cache using `MemoryCache.Default`.
- `ApiLogService`: writes API call logs to SQL.
- `CacheLogService`: writes cache metadata to SQL.

The library references `Ecatalog.Models`.

### Ecatalog.Models

`Ecatalog.Models` contains DTO-style classes used to deserialize API responses and bind MVC requests. These include:

- API wrapper models
- authentication response models
- product search models
- product tab models
- vehicle/filter models
- user/session-related models

These are not Entity Framework entities; they represent data contracts between the MVC app, JavaScript UI, and external API responses.

### Ecatalog.Data

`Ecatalog.Data` exists in the solution and references `Ecatalog.Library` and `Ecatalog.Models`, but it currently contains no meaningful data access implementation beyond project metadata/configuration.

The main web project does not reference `Ecatalog.Data`, so it is not part of the current runtime path.

## Runtime Startup

Application startup is handled by `Ecatalog/Global.asax.cs`.

On `Application_Start`, the app registers:

- MVC areas
- global filters
- MVC routes
- script/style bundles

Routing is configured in `App_Start/RouteConfig.cs` using the standard MVC route:

```text
/{controller}/{action}/{id}
```

The default route is:

```text
Login/Login
```

## High-Level Request Flow

```text
Browser
  |
  | Razor pages, JavaScript, AJAX/fetch
  v
ASP.NET MVC Controllers
  |
  | Utils.CallApiAsyncMemory<T>()
  v
Ecatalog.Library.ApiGatewayService
  |
  | optional MemoryCache lookup/write
  | API/cache SQL logging
  v
External Ecatalog API Service
```

Most catalog data is not loaded directly from the database by MVC controllers. Instead, controllers call `Utils.CallApiAsyncMemory<T>()`, which builds an `ApiRequestModel` and sends it through `ApiGatewayService`.

## Web Layer

### Controllers

The main controllers are:

- `LoginController`
  - renders the login page
  - authenticates users through the external API
  - stores user details in ASP.NET Session
  - clears session on logout

- `HomeController`
  - renders the main product search page
  - checks login state through `Utils.IsLogin`

- `MasterController`
  - exposes lookup/filter JSON endpoints
  - wraps API calls for market, model range, body, engine, brands, product groups, product lines, and matched product groups

- `ProductController`
  - exposes product search endpoints
  - exposes product detail tab endpoints such as description, spec, image, OEM, competitor, and linkage

- `MemoryCacheManageController`
  - exposes cache inspection endpoints
  - exposes current IIS process memory information

Controllers are intentionally thin. Their typical responsibilities are:

1. Accept MVC action parameters or request models.
2. Call the shared API helper.
3. Optionally reshape/group returned data.
4. Return JSON to the browser.

### Views

The login page is rendered by:

```text
Views/Login/Login.cshtml
```

The main product application is rendered by:

```text
Views/Home/Index.cshtml
```

`Index.cshtml` uses `Layout = null` and composes the UI from partial views under:

```text
Views/Parts/
```

Important partials include:

- `_Header.cshtml`
- `_Sidebar.cshtml`
- `_ProductGroup.cshtml`
- `_ProductSpec.cshtml`
- `_Cart.cshtml`
- `_OrderSummary.cshtml`

## Frontend Architecture

The main product screen is JavaScript-driven. Razor renders the shell, then browser-side scripts call MVC JSON endpoints.

Key scripts:

- `Scripts/truscripts.js`
  - main UI state
  - product rendering
  - filters
  - bottom product group bar
  - cart and order summary interactions
  - modal/drawer behavior

- `Scripts/productSearch.js`
  - product search API call
  - mapping grouped API results into frontend product arrays
  - product spec modal/drawer entry points

- `Scripts/productTabLoader.js`
  - lazy-loads product detail tabs by `stkcode`
  - supports desktop modal, mobile drawer, and inline modes
  - performs client-side tab response normalization/rendering

The browser calls endpoints such as:

```text
/Master/GetBrands
/Master/GeProductGroups
/Master/GeProductLines
/Master/GetMatchProductionGroup
/Product/GetProductBySearchVio
/Product/GetTabSpec
/Product/GetTabImage
```

## API Integration

External API calls are centralized in:

```text
Ecatalog.Library/Services/ApiGatewayService.cs
```

`ApiGatewayService` uses a static `HttpClient` and supports:

- GET requests with query string generation
- POST requests with JSON bodies
- API authentication headers
- JSON deserialization with Newtonsoft.Json
- optional in-memory caching
- API call logging

API credentials and base URL are loaded from `Web.config` app settings:

```text
ApiUrlService
ApiUsername
ApiPassword
ApiKey
```

The helper method most controllers use is:

```csharp
Utils.CallApiAsyncMemory<T>(
    string url,
    string method,
    object dataParam = null,
    bool useCache = false,
    int cacheMinutes = 10)
```

## Caching

Caching is implemented with `System.Runtime.Caching.MemoryCache`.

Cache behavior:

- in-process only
- scoped to the IIS worker process
- lost on app pool recycle
- absolute expiration by minutes
- key prefix: `API_CACHE_`

Cache keys are generated from:

```text
URL + HTTP method + serialized request body
```

The raw cache key material is hashed with SHA-256.

Some endpoints use cache, for example product search and master data endpoints. Login authentication is called with caching disabled.

Cache metadata is optionally logged to the database table used by `CacheLogService`.

## Logging

API call logging is handled by:

```text
Ecatalog.Library/Services/ApiLogService.cs
```

It writes records containing:

- URL
- method
- request body
- response body
- HTTP status code
- success flag
- cache flag
- error message
- execution time
- created date

Cache logging is handled by:

```text
Ecatalog.Library/Services/CacheLogService.cs
```

Both services use the `ApiDB` app setting as their SQL connection string.

Logging failures are swallowed, so logging does not break user-facing requests.

## Authentication and Session

Authentication is session-based.

`LoginController.AuthenUser` calls:

```text
Ecatalog/UserAuthen
```

If the API returns a user, the app stores values in ASP.NET Session:

```text
username
email
UserType
slmcode
cuscode
userType
isActive
```

`Utils.IsLogin` checks whether `Session["username"]` is present.

`HomeController.Index` checks this login state before rendering the main page.

## Configuration

The main runtime configuration is in:

```text
Ecatalog/Web.config
```

Important app settings include:

- `ECatalogDB`
- `ApiDB`
- `MobileOrderDB`
- `ApiUsername`
- `ApiPassword`
- `ApiKey`
- `ApiUrlService`
- `RedisConnection`

The project includes a Redis package/reference, but the inspected runtime path uses `MemoryCache.Default`; Redis does not appear to be active in the current implementation.

## Deployment Model

This is a .NET Framework MVC application intended for IIS.

Runtime assumptions:

- IIS/App Pool hosting
- ASP.NET Session enabled with `InProc` mode
- app settings available from `Web.config`
- external API service reachable from the web server
- SQL Server reachable for API/cache logging

## Architectural Notes and Risks

### Unused Data Project

`Ecatalog.Data` is present but unused by the web app. This may be a placeholder for future data access, or legacy structure that is no longer needed.

### Direct Secrets in Web.config

API credentials and database credentials are stored directly in `Web.config`. This increases operational risk if the repository or deployment package is broadly accessible.

### Partial Login Enforcement

`HomeController.Index` checks login state, but the JSON API controllers do not appear to use `[Authorize]` or a shared authorization filter. If these endpoints are externally reachable, they may be callable without a valid session.

### In-Process Cache Only

The cache is local to one IIS worker process. In a multi-server or web garden setup, each process will have its own cache state.

### Logging Swallows Errors

API and cache logging failures are intentionally ignored. This prevents logging issues from breaking requests, but it can hide database/logging outages.

### API Gateway Coupling

Controllers depend on concrete static helper calls through `Utils`. This keeps code simple, but makes unit testing and dependency substitution harder.

### Frontend State Concentration

Much of the frontend behavior is concentrated in large JavaScript files, especially `truscripts.js`. This works for a traditional MVC app, but the file is broad in responsibility and may become difficult to maintain as workflows grow.

## Current Architecture Summary

The current system is best understood as:

```text
ASP.NET MVC UI/BFF
  + session-based login
  + JavaScript-heavy product search UI
  + external API gateway
  + in-process response cache
  + SQL-backed API/cache logging
```

It is not currently a database-first MVC application. The main catalog behavior is driven by an external API service, with this repository owning the user interface, request orchestration, caching, and response shaping.
