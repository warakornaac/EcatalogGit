using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabDescriptionModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabDescription> result { get; set; }
    }
    public class ResultProductTabDescription
    {
        public string stkcode { get; set; }
        public int seqDescription { get; set; }
        public string title { get; set; }
        public string description { get; set; }
        public string insertedBy { get; set; }
        public string insertedDate { get; set; }
        public string updatedBy { get; set; }
        public string updatedDate { get; set; }
    }
}
