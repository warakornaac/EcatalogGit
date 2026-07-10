using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    
    public class ShiptoByCuscodeModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultShiptoByCuscode> result { get; set; }
    }

    public class ResultShiptoByCuscode
    {
        public string cusCode { get; set; }

        public string shipCode { get; set; }

        public string name { get; set; }

        public string address { get; set; }

        public string address2 { get; set; }

        public string city { get; set; }

        public string contact { get; set; }

        public string phone { get; set; }

        public string postCode { get; set; }

        public string shipFromWarehowse { get; set; }
    }
}
