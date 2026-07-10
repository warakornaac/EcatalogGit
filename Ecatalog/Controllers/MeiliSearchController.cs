using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Newtonsoft.Json;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Ecatalog.Models;
using System.Configuration;
using System.Data.SqlClient;
using System.Data;
using Ecatalog.Library;

namespace Ecatalog.Controllers
{
    public class MeiliSearchController : Controller
    {
        private const string Host = "http://localhost:7700";
        private const string ApiKey = "HCJiA-w-iSsJYlWa3an3H3Lnp85-zxRWaWGDW5E2t4U";

        [HttpGet]
        public async Task<ActionResult> ImportSearchDictionary() {
            string path = @"D:\MeiliSearch_Json\SearchDictionary.json";

            await Import(path);

            return Content("Import Success");
        }

        private async Task Import(string jsonPath) {
            var list =
                JsonConvert.DeserializeObject<List<SearchDictionaryModel>>
                (
                    System.IO.File.ReadAllText(jsonPath, Encoding.UTF8)
                );

            const int batchSize = 500;

            using (var client = new HttpClient()) {
                client.DefaultRequestHeaders.Add(
                    "Authorization",
                    "Bearer " + ApiKey);

                for (int i = 0; i < list.Count; i += batchSize) {
                    var batch = list
                        .Skip(i)
                        .Take(batchSize)
                        .ToList();

                    string json = JsonConvert.SerializeObject(batch);

                    var content = new StringContent(
                        json,
                        Encoding.UTF8,
                        "application/json");

                    var response = await client.PostAsync(
                        Host + "/indexes/search_dictionary/documents",
                        content);

                    response.EnsureSuccessStatusCode();
                }
            }
        }
        public ActionResult ExportSearchDictionary() {
            string connString = Utils.GetConfig("ECatalogDB");
            string filePath = @"D:\MeiliSearch_Json\SearchDictionary.json";

            using (SqlConnection conn = new SqlConnection(connString))
            using (SqlCommand cmd = new SqlCommand("P_Export_SearchDictionary", conn)) {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.CommandTimeout = 00;

                conn.Open();

                using (SqlDataReader dr = cmd.ExecuteReader(CommandBehavior.SequentialAccess))
                using (StreamWriter writer = new StreamWriter(
                            filePath,
                            false,
                            new UTF8Encoding(false))) {
                    char[] buffer = new char[8192];

                    while (dr.Read()) {
                        long offset = 0;

                        while (true) {
                            long read =
                                dr.GetChars(
                                    0,
                                    offset,
                                    buffer,
                                    0,
                                    buffer.Length);

                            if (read == 0)
                                break;

                            writer.Write(buffer, 0, (int)read);

                            offset += read;
                        }
                    }
                }
            }

            return Json(new {
                Success = true,
                File = filePath
            }, JsonRequestBehavior.AllowGet);
        }
    }
}