using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Caching;
using Newtonsoft.Json;

namespace Ecatalog.Library.Services
{
    public class MemoryCacheService
    {
        private static readonly MemoryCache cache =
            MemoryCache.Default;

        // =========================
        // GET CACHE
        // =========================

        public T Get<T>(string key) {
            object value =
                cache.Get(key);

            if (value == null) {
                return default(T);
            }

            return (T)value;
        }

        // =========================
        // SET CACHE
        // =========================

        public void Set<T>(
            string key,
            T value,
            int cacheMinute) {
            CacheItemPolicy policy =
                new CacheItemPolicy {
                    AbsoluteExpiration =
                        DateTimeOffset.Now
                        .AddMinutes(cacheMinute)
                };

            cache.Set(
                key,
                value,
                policy);
        }

        // =========================
        // REMOVE CACHE
        // =========================

        public void Remove(string key) {
            if (cache.Contains(key)) {
                cache.Remove(key);
            }
        }

        // =========================
        // GET CACHE COUNT
        // =========================

        public long GetCount() {
            return cache.GetCount();
        }

        // =========================
        // GET ALL API CACHE KEYS
        // =========================

        public List<string> GetAllKeys() {
            return cache
                .Where(x =>
                    x.Key.StartsWith(
                        "API_CACHE_"))
                .Select(x => x.Key)
                .ToList();
        }

        // =========================
        // GET ALL API CACHE
        // =========================

        public List<object> GetAllCache() {
            return cache
                .Where(x =>
                    x.Key.StartsWith(
                        "API_CACHE_"))
                .Select(x => new {
                    Key = x.Key,

                    Type =
                        x.Value != null
                        ? x.Value.GetType().Name
                        : "NULL",

                    Json =
                        JsonConvert.SerializeObject(
                            x.Value,
                            Formatting.None,
                            new JsonSerializerSettings {
                                ReferenceLoopHandling =
                                    ReferenceLoopHandling.Ignore
                            })
                })
                .ToList<object>();
        }
    }
}