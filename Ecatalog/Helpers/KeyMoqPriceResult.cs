using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Ecatalog.Library;
using Ecatalog.Models;

namespace Ecatalog.Helpers
{
    public static class KeyMoqPriceResult                       // ★ static class
    {
        /// <summary>สร้าง key "STKCODE|COMPANY" สำหรับ lookup</summary>
        public static string MoqKey(string stkcode, string company)   // ★ public static
        {
            return (stkcode ?? "").Trim().ToUpperInvariant() + "|" + (company ?? "").Trim().ToUpperInvariant();
        }

        /// <summary>
        /// เรียก API ครั้งเดียว แล้วคืน Dictionary: key = "STKCODE|COMPANY", value = รายการ moq/price
        /// ถ้า error จะคืน dictionary ว่าง เพื่อไม่ให้การค้นหาสินค้าหลักพัง
        /// </summary>
        public static async Task<Dictionary<string, List<ProductMoqPriceItemModel>>> GetUomPriceLookupAsync(   // ★ public static
            List<ProductMoqPriceRequestItemModel> items, string cusCode) {
            var lookup = new Dictionary<string, List<ProductMoqPriceItemModel>>();

            if (items == null || !items.Any())
                return lookup;

            try {
                var apiRequest = new ProductMoqPriceRequestModel { items = items, CusCode = cusCode };

                var result = await Utils.CallApiAsyncMemory<ProductMoqPriceResponseModel>(
                    "Ecatalog/GetProductUomPrice",     // ★ ต้องตรงกับ [Route] ฝั่ง API
                    "POST",
                    apiRequest,
                    false,
                    60
                );

                if (result == null || !result.IsSuccess || result.Data == null || result.Data.result == null) {
                    System.Diagnostics.Debug.WriteLine("[MOQ] API failed: " + (result != null ? result.ErrorMessage : "null"));
                    return lookup;
                }

                lookup = result.Data.result
                    .GroupBy(x => MoqKey(x.stkcode, x.company))
                    .ToDictionary(g => g.Key, g => g.ToList());
            }
            catch (Exception ex) {
                System.Diagnostics.Debug.WriteLine("[MOQ] Exception: " + ex.Message);
            }

            return lookup;
        }
    }
}