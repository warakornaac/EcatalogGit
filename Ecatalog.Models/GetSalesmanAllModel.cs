using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class GetSalesmanAllModel
    {
            public int statusCode { get; set; }
            public string errorMessage { get; set; }
            public List<ResultGetSalesmanAll> result { get; set; }
    }
        public class ResultGetSalesmanAll
    {
        public string slmCode { get; set; }
        public string slmName { get; set; }
    }
}
