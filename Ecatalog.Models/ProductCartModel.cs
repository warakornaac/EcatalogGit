using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductCartModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultCartItemList> result { get; set; }
    }
    public class ResultCartItemList
    {
        public string ordId { get; set; }
        public string company { get; set; }
        public string cuscod { get; set; }
        public string orddat { get; set; }
        public string stkcod { get; set; }
        public string stkdes { get; set; }
        public string stkgrp { get; set; }
        public string minord { get; set; }
        public string price { get; set; }
        public string backOrder { get; set; }
        public string qty { get; set; }
        public string amt { get; set; }
        public string uom { get; set; }
        public string status { get; set; }
        public string insertedDate { get; set; }
        public string insertedBy { get; set; }
        public string updatedDate { get; set; }
        public string updatedBy { get; set; }
        public string imagePath { get; set; }

    }
}
