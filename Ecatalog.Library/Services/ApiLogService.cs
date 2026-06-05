using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace Ecatalog.Library.Services
{
    public class ApiLogService
    {
        private readonly string _connectionString;

        public ApiLogService() {
            _connectionString = Utils.GetConfig("ApiDB");
        }

        public void SaveLog(
            string url,
            string method,
            string request,
            string response,
            int statusCode,
            bool isSuccess,
            bool isFromCache,
            string errorMessage,
            int executionTime) {
            try {
                using (SqlConnection conn = new SqlConnection(_connectionString)) {
                    string sql = @"
                            INSERT INTO ApiServiceCall_Log
                            (
                                Url,
                                Method,
                                RequestBody,
                                ResponseBody,
                                StatusCode,
                                IsSuccess,
                                IsFromCache,
                                ErrorMessage,
                                ExecutionTimeMs,
                                CreatedDate
                            )
                            VALUES
                            (
                                @Url,
                                @Method,
                                @RequestBody,
                                @ResponseBody,
                                @StatusCode,
                                @IsSuccess,
                                @IsFromCache,
                                @ErrorMessage,
                                @ExecutionTimeMs,
                                GETDATE()
                            )";

                    using (SqlCommand cmd = new SqlCommand(sql, conn)) {
                        cmd.Parameters.Add("@Url", SqlDbType.NVarChar, 1000).Value = (object)url ?? DBNull.Value;
                        cmd.Parameters.Add("@Method", SqlDbType.NVarChar, 10).Value = (object)method ?? DBNull.Value;
                        cmd.Parameters.Add("@RequestBody", SqlDbType.NVarChar).Value = (object)request ?? DBNull.Value;
                        cmd.Parameters.Add("@ResponseBody", SqlDbType.NVarChar).Value = (object)response ?? DBNull.Value;
                        cmd.Parameters.Add("@StatusCode", SqlDbType.Int).Value = statusCode;
                        cmd.Parameters.Add("@IsSuccess", SqlDbType.Bit).Value = isSuccess;
                        cmd.Parameters.Add("@IsFromCache", SqlDbType.Bit).Value = isFromCache;
                        cmd.Parameters.Add("@ErrorMessage", SqlDbType.NVarChar).Value = (object)errorMessage ?? DBNull.Value;
                        cmd.Parameters.Add("@ExecutionTimeMs", SqlDbType.Int).Value = executionTime;
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
