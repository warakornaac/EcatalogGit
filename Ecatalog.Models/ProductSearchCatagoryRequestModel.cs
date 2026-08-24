using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Ecatalog.Models
{
    // ── REQUEST ──────────────────────────────────────────────
    public class ProductSearchCatagoryRequestModel
    {
        public List<string> productGroupId { get; set; }  // ✅ string ตาม External API
        public List<string> productLineId { get; set; }  // ✅
        public List<string> brandId { get; set; }  // ✅
        public List<string> fittingFilter { get; set; }
        public string marketSegmentId { get; set; }
        public string segmentId { get; set; }
        public string makerId { get; set; }
        public string rangeId { get; set; }
        public string bodyId { get; set; }
        public string engineId { get; set; }
        public string yearFrom { get; set; }
        public string yearTo { get; set; }
        public string driveType { get; set; }

        [JsonProperty("SlmCode")]
        public string SlmCode { get; set; }

        [JsonProperty("CusCode")]
        public string CusCode { get; set; }

        [JsonProperty("Company")]
        public List<string> Company { get; set; }
    }

    // ── RESPONSE ─────────────────────────────────────────────
    public class ProductSearchCatagoryResponseModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductSearchCatagory> result { get; set; }
    }

    public class ResultProductSearchCatagory
    {
        public int productGroupId { get; set; }
        public string productGroup { get; set; }
        public int productLineId { get; set; }
        public string productLine { get; set; }
        public int brandId { get; set; }
        public string brand { get; set; }
        public string stkcode { get; set; }
        public string stkcodeDescription { get; set; }
        public decimal price { get; set; }
        public string qtyReady { get; set; }
        public string makerName { get; set; }
        public string modelName { get; set; }
        public string imagePath { get; set; }
        public string imageUrl { get; set; }
        public string slmCode { get; set; }
        public string cusCode { get; set; }
        public List<string> company { get; set; } // ← เปลี่ยนจาก string เป็น List<string>
        public string fittingDescription { get; set; }
    }
}