using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class BrandsFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultBrandsList> result { get; set; }
    }
    public class ResultBrandsList
    {
        public string id { get; set; }
        public string name { get; set; }

    }
}
