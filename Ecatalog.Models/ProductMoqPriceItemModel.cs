using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductMoqPriceItemModel
    {
        public string stkcode { get; set; }
        public string moq { get; set; }
        public decimal price { get; set; }
        public string company { get; set; }
    }
    public class ProductMoqPriceResponseModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ProductMoqPriceItemModel> result { get; set; }
    }
}
