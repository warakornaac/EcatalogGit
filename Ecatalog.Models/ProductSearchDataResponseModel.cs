using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductSearchDataResponseModel
    {
        // ── กลุ่มสินค้า ──────────────────────────
        public string productGroupId { get; set; }
        public string productGroup { get; set; }
        public string productLineId { get; set; }
        public string productLine { get; set; }

        // ── แบรนด์ ───────────────────────────────
        public string brandId { get; set; }
        public string brand { get; set; }

        // ── ข้อมูลสินค้า ──────────────────────────
        public string stkcode { get; set; }
        public string stkcodeDescription { get; set; }
        public string price { get; set; }
        public string qtyReady { get; set; }
        public string fittingDescription { get; set; }

        // ── รุ่นรถ ───────────────────────────────
        public string makerName { get; set; }
        public string modelName { get; set; }

        // ── รูปภาพ ───────────────────────────────
        public string imagePath { get; set; }
        public string imageUrl { get; set; }

        // ── ข้อมูลผู้ขาย / ลูกค้า / บริษัท ───────────
        public string slmCode { get; set; }
        public string cusCode { get; set; }
        public string company { get; set; }
    }
}
