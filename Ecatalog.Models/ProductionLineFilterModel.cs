using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ModelProductionLineFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductionLineFilterList> result { get; set; }

    }
    public class ResultProductionLineFilterList
    {
        public string prodlineid { get; set; }
        public string prodlinename { get; set; }
    }
}
