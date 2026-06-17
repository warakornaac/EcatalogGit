using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabOemModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabOemList> result { get; set; }
    }
    public class ResultProductTabOemList
    {
        public string stkcode { get; set; }
        public int seqOem { get; set; }
        public string oemNumber { get; set; }
        public string makerName { get; set; }
        public string insertedBy { get; set; }
        public string insertedDate { get; set; }
        public string updatedBy { get; set; }
        public string updatedDate { get; set; }
    }
}
