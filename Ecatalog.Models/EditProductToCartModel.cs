using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class EditProductToCartModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultEditProductToCart> result { get; set; }
    }
    public class ResultEditProductToCart
    {
        public string ordId { get; set; }
        public string username { get; set; }
        public string company { get; set; }

        public string cuscod { get; set; }
        public string stkcod { get; set; }
        public int qty { get; set; }
        public decimal price { get; set; }
        public int backorder { get; set; }
    }
}
