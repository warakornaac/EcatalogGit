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
        public string cuscode { get; set; }
        public string username { get; set; }
    }
}
