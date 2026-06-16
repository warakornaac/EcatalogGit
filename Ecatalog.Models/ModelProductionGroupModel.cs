using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ModelProductionGroupFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductionGroupFilterList> result { get; set; }

    }
    public class ResultProductionGroupFilterList
    {
        public string prodgrpid { get; set; }
        public string prodgrpname { get; set; }
    }
}
