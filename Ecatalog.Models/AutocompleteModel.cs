using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class AutocompleteRequestModel
    {
        public string cuscode { get; set; }
        public string insearch { get; set; }
        public List<string> Company { get; set; }
        public List<string> searchFields { get; set; }
    }
    public class AutocompleteResponeModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultAutocomplete> result { get; set; }
    }

    public class ResultAutocomplete
    {
        public string stkcode { get; set; }
        public string stkdes { get; set; }
        public string oem { get; set; }
    }
}
