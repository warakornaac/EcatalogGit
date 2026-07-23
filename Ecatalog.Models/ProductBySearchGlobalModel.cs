using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Ecatalog.Models
{
    public class ProductBySearchGlobalModel
    {
        // ✅ ให้ตรงกับ JSON จริงที่ API ส่งมา
        [JsonProperty("statusCode")]
        public int StatusCode { get; set; }

        [JsonProperty("errorMessage")]
        public string ErrorMessage { get; set; }

        [JsonProperty("result")]
        public List<ResultProductBySearchGlobal> Result { get; set; }

        // helper property — ไม่ต้องแก้ Controller
        public bool Success => StatusCode == 200;
        public string Message => ErrorMessage;
        public List<ResultProductBySearchGlobal> Items => Result;
    }

    public class ResultProductBySearchGlobal
    {
        public string stkcode { get; set; }
        public string stkcodeDescription { get; set; }
        public string brand { get; set; }
        public string makerName { get; set; }
        public string modelName { get; set; }
        public string qtyReady { get; set; }
        public string price { get; set; }
        public string productGroup { get; set; }
        public string productLine { get; set; }
        public string imagePath { get; set; }
    }
}