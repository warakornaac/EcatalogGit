using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class AddToCartResponse
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public CartAddResponse result { get; set; }
    }

    public class CartAddResponse
    {
        public string cuscode { get; set; }
        public string stkcod { get; set; }
        public string company { get; set; }
        public string price { get; set; }
        public string qty { get; set; }
        public string username { get; set; }
        public string backorder { get; set; }
    }
}
