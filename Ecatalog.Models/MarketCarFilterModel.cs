using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class MarketCarFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultList> result { get; set; }
    }
    public class ResultList
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }
}
