using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductMoqPriceRequestItemModel
    {
        public string stkcode { get; set; }
        public string company { get; set; }
    }

    public class ProductMoqPriceRequestModel
    {
        public List<ProductMoqPriceRequestItemModel> items { get; set; }
        public string CusCode { get; set; }
    }
}
