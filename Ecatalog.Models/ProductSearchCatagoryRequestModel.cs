using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    // ── REQUEST ──────────────────────────────────────────────
    public class ProductSearchCatagoryRequestModel
    {
        public List<int> productGroupId { get; set; }
        public List<int> productLineId { get; set; }
        public List<int> brandId { get; set; }
        public List<string> fittingFilter { get; set; }
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
        public string company { get; set; }
        public string fittingDescription { get; set; } // ✅
    }
}