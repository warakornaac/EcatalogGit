using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Library.Services
{
    public class CacheLogService
    {
        private readonly string _connectionString;

        public CacheLogService() {
            _connectionString = Utils.GetConfig("ApiDB");
        }
        public void SaveCacheInfo(string cacheKey, string url, string requestJson, int cacheMinutes) {
            try {
                using (SqlConnection conn = new SqlConnection(_connectionString)) {
                    string sql = @"
                INSERT INTO ApiCache_Log
                (
                    CacheKey,
                    ApiUrl,
                    RequestJson,
                    CreatedDate,
                    ExpireDate,
                    HitCount,
                    LastAccessDate,
                    IsActive
                )
                VALUES
                (
                    @CacheKey,
                    @ApiUrl,
                    @RequestJson,
                    GETDATE(),
                    DATEADD(MINUTE,@CacheMinute,GETDATE()),
                    0,
                    GETDATE(),
                    1
                )";
                    using (SqlCommand cmd = new SqlCommand(sql, conn)) {
                        cmd.Parameters.AddWithValue("@CacheKey", cacheKey);
                        cmd.Parameters.AddWithValue("@ApiUrl", url);
                        cmd.Parameters.AddWithValue("@RequestJson", requestJson ?? "");
                        cmd.Parameters.AddWithValue("@CacheMinute", cacheMinutes);
                        conn.Open();
                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch {
                // log error ได้ตามต้องการ
            }
        }

        /// <summary>
        /// เพิ่ม Hit Count เมื่อ Cache ถูกเรียกใช้
        /// </summary>
        public void UpdateHitCount(string cacheKey) {
            try {
                using (SqlConnection conn = new SqlConnection(_connectionString)) {
                    string sql = @"
                        UPDATE ApiCache_Log
                        SET
                            HitCount =
                                ISNULL(HitCount,0) + 1,

                            LastAccessDate =
                                GETDATE()

                        WHERE CacheKey =
                            @CacheKey";

                    using (SqlCommand cmd =
                        new SqlCommand(
                            sql,
                            conn)) {
                        cmd.Parameters.AddWithValue(
                            "@CacheKey",
                            cacheKey);

                        conn.Open();

                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch {
            }
        }
        /// <summary>
        /// ปิด Cache เมื่อหมดอายุ
        /// </summary>
        public void MarkExpired(string cacheKey) {
            try {
                using (SqlConnection conn =
                    new SqlConnection(
                        _connectionString)) {
                    string sql = @"
                                UPDATE ApiCache_Log
                                SET
                                    IsActive = 0
                                WHERE CacheKey = @CacheKey";

                    using (SqlCommand cmd =
                        new SqlCommand(
                            sql,
                            conn)) {
                        cmd.Parameters.AddWithValue(
                            "@CacheKey",
                            cacheKey);

                        conn.Open();

                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch {
            }
        }
        /// <summary>
        /// Cleanup Cache ที่หมดอายุ
        /// </summary>
        public void CleanupExpired() {
            try {
                using (SqlConnection conn =
                    new SqlConnection(
                        _connectionString)) {
                    string sql = @"
                            UPDATE ApiCache_Log
                            SET
                                IsActive = 0
                            WHERE
                                ExpireDate < GETDATE()
                                AND IsActive = 1";

                    using (SqlCommand cmd =
                        new SqlCommand(
                            sql,
                            conn)) {
                        conn.Open();

                        cmd.ExecuteNonQuery();
                    }
                }
            }
            catch {
            }
        }

    }
}
