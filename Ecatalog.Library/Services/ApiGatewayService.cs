using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Runtime.Caching;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Ecatalog.Models;
using Newtonsoft.Json;

namespace Ecatalog.Library.Services
{
    public class ApiGatewayService
    {
        private static readonly HttpClient client;

        private readonly MemoryCacheService _cache;

        private readonly CacheLogService _cacheLog;

        private readonly ApiLogService _log;

        static ApiGatewayService() {
            client = new HttpClient();

            client.Timeout = TimeSpan.FromSeconds(180);
        }

        public ApiGatewayService() {
            _cache = new MemoryCacheService();
            _log = new ApiLogService();
            _cacheLog = new CacheLogService();
        }

        public async Task<ApiResponseModel<T>>
            SendAsync<T>(
                ApiRequestModel request) {
            Stopwatch sw =
                new Stopwatch();

            sw.Start();

            var result =
                new ApiResponseModel<T>();

            string requestJson =
                request.DataParam != null
                ? JsonConvert.SerializeObject(
                    request.DataParam)
                : "";

            try {
                // =====================
                // GET -> QUERY STRING
                // =====================

                if (request.Method.ToUpper() == "GET"
                     && request.DataParam != null) {
                    string queryString =
                        BuildQueryString(
                            request.DataParam);

                    request.Url =
                        request.Url + "?" + queryString;
                }

                // =====================
                // GENERATE CACHE KEY
                // =====================

                string cacheKey =
                    GenerateCacheKey(
                        request.Url,
                        request.Method,
                        requestJson);

                Debug.WriteLine("CACHE KEY : " + cacheKey);

                // =====================
                // CHECK CACHE
                // =====================

                if (request.UseCache) {
                    var cacheData = _cache.Get<T>(cacheKey);
                    if (cacheData != null) {
                        Debug.WriteLine("CACHE HIT");

                        result.IsSuccess = true;
                        result.IsFromCache = true;
                        result.Data = cacheData;
                        return result;
                    }

                    Debug.WriteLine("CACHE MISS");
                }

                // =====================
                // CREATE REQUEST
                // =====================

                HttpRequestMessage httpRequest =
                    new HttpRequestMessage(
                        new HttpMethod(
                            request.Method),
                        request.Url);

                // =====================
                // HEADER
                // =====================

                httpRequest.Headers.Add("Username", request.Username);
                httpRequest.Headers.Add("Password", request.Password);
                httpRequest.Headers.Add("ApiKey", request.ApiKey);

                // =====================
                // POST -> BODY JSON
                // =====================

                if (request.Method.ToUpper() == "POST"
                    && request.DataParam != null) {
                    httpRequest.Content =
                        new StringContent(
                            requestJson,
                            Encoding.UTF8,
                            "application/json");
                }

                Debug.WriteLine(
                    "API URL : " + request.Url);

                // =====================
                // SEND REQUEST
                // =====================

                HttpResponseMessage response =
                    await client.SendAsync(
                        httpRequest);

                string responseText =
                    await response
                    .Content
                    .ReadAsStringAsync();

                result.StatusCode =
                    (int)response.StatusCode;

                result.IsSuccess =
                    response.IsSuccessStatusCode;

                // =====================
                // SUCCESS
                // =====================

                if (response.IsSuccessStatusCode) {
                    try {
                        result.Data =
                            JsonConvert
                            .DeserializeObject<T>(
                                responseText);

                        Debug.WriteLine(
                            "DESERIALIZE SUCCESS");

                        // SAVE CACHE
                        if (request.UseCache) {
                            Debug.WriteLine(
                                "SAVE CACHE");

                            _cache.Set(
                                cacheKey,
                                result.Data,
                                request.CacheMinutes);
                            _cacheLog.SaveCacheInfo(
                                cacheKey,
                                request.Url,
                                requestJson,
                                request.CacheMinutes);
                        }
                    }
                    catch (Exception ex) {
                        Debug.WriteLine(
                            ex.ToString());

                        result.IsSuccess = false;

                        result.ErrorMessage =
                            ex.ToString();
                    }
                }
                else {
                    result.ErrorMessage =
                        responseText;
                }

                sw.Stop();

                result.ExecutionTime =
                    sw.ElapsedMilliseconds;

                // =====================
                // SAVE LOG
                // =====================

                _log.SaveLog(
                    request.Url,
                    request.Method,
                    requestJson,
                    responseText,
                    result.StatusCode,
                    result.IsSuccess,
                    result.IsFromCache,
                    result.ErrorMessage,
                    (int)result.ExecutionTime
                );
            }
            catch (Exception ex) {
                sw.Stop();

                result.IsSuccess = false;

                result.ExecutionTime =
                    sw.ElapsedMilliseconds;

                result.ErrorMessage =
                    ex.ToString();

                _log.SaveLog(
                    request.Url,
                    request.Method,
                    requestJson,
                    "",
                    500,
                    false,
                    false,
                    ex.ToString(),
                    (int)result.ExecutionTime
                );
            }

            return result;
        }

        // =====================
        // GENERATE CACHE KEY
        // =====================

        private string GenerateCacheKey(
            string url,
            string method,
            string requestBody) {
            string raw =
                $"{url}_{method}_{requestBody}";

            using (SHA256 sha =
                SHA256.Create()) {
                byte[] bytes =
                    sha.ComputeHash(
                        Encoding.UTF8.GetBytes(raw));

                StringBuilder sb =
                    new StringBuilder();

                foreach (byte b in bytes) {
                    sb.Append(
                        b.ToString("x2"));
                }

                return "API_CACHE_" +
                    sb.ToString();
            }
        }

        // =====================
        // BUILD QUERY STRING
        // =====================

        private string BuildQueryString(
            object obj) {
            if (obj == null) {
                return "";
            }

            var properties =
                obj.GetType().GetProperties();

            var list =
                properties.Select(p =>
                    p.Name + "=" +
                    Uri.EscapeDataString(
                        Convert.ToString(
                            p.GetValue(obj) ?? "")));

            return string.Join("&", list);
        }
    }
}