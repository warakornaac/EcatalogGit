using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabLinkageModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabLinkageList> result { get; set; }
    }
    public class ResultProductTabLinkageList
    {
        public string stkcode { get; set; }
        public int seqLinkage { get; set; }
        public string kType { get; set; }
        public string productId { get; set; }
        public string truType { get; set; }
        public string maker { get; set; }
        public string model { get; set; }
        public string body { get; set; }
        public string engine { get; set; }
        public string driveType { get; set; }
        public int yearFrom { get; set; }
        public int yearTo { get; set; }
    }
}