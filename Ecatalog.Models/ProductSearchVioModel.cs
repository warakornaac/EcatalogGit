using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductSearchVioModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductSearchVioModelList> result { get; set; }
    }
    public class ResultProductSearchVioModelList
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
