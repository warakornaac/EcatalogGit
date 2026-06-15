using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabItemCountModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabItemCountList> result { get; set; }
    }
    public class ResultProductTabItemCountList
    {
        public string stkcode { get; set; }
        public string stkcodeDescription { get; set; }
        public string brandName { get; set; }
        public string makerName { get; set; }
        public string modelName { get; set; }
        public string qtyReady { get; set; }
        public string price { get; set; }
        public string productGroup { get; set; }
        public string productLine { get; set; }
        public string imagePath { get; set; }
        public int countProductDes { get; set; }
        public int countProductSpec { get; set; }
        public int countProductImage { get; set; }
        public int countProductOem { get; set; }
        public int countProductCom { get; set; }
        public int countProductLinkage { get; set; }
    }
}
