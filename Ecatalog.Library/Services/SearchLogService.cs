using Ecatalog.Library;
using Ecatalog.Models;
using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;

namespace Ecatalog.Services
{
    public class SearchLogService
    {
        private readonly string _connectionString;

        public SearchLogService()
        {
            _connectionString = Utils.GetConfig("ECatalogDB");
        }

        public async Task SaveSearchLog(SearchLogModel model)
        {
            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                using (SqlCommand cmd = new SqlCommand("P_Insert_SearchLog", conn))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@UserId",
                        (object)model.UserId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@UserType",
                        (object)model.UserType ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@SearchType",
                        model.SearchType);

                    cmd.Parameters.AddWithValue("@SearchText",
                        (object)model.SearchText ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@SearchFields",
                        (object)model.SearchFields ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@ProductGroupId",
                        (object)model.ProductGroupId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@ProductLineId",
                        (object)model.ProductLineId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@BrandId",
                        (object)model.BrandId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@FittingFilter",
                        (object)model.FittingFilter ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@MarketSegmentId",
                        (object)model.MarketSegmentId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@SegmentId",
                        (object)model.SegmentId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@MakerId",
                        (object)model.MakerId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@RangeId",
                        (object)model.RangeId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@BodyId",
                        (object)model.BodyId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@EngineId",
                        (object)model.EngineId ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@YearFrom",
                        (object)model.YearFrom ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@YearTo",
                        (object)model.YearTo ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@DriveType",
                        (object)model.DriveType ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@SlmCode",
                        (object)model.SlmCode ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@CusCode",
                        (object)model.CusCode ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@Company",
                        (object)model.Company ?? DBNull.Value);

                    cmd.Parameters.AddWithValue("@ResultCount",
                        model.ResultCount);

                    cmd.Parameters.AddWithValue("@SearchStatus",
                        model.SearchStatus);

                    cmd.Parameters.AddWithValue("@ResponseTimeMs",
                        (object)model.ResponseTimeMs ?? DBNull.Value);

                    await conn.OpenAsync().ConfigureAwait(false);
                    await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine(
                    "[SearchLog] Save Error: " + ex.Message
                );
            }
        }
    }
}