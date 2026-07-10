using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class GetCustomerbySalesmanModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultGetCustomerbySalesman> result { get; set; }
    }
    public class ResultGetCustomerbySalesman
    {
        public string company { get; set; }
        public string cuscode { get; set; }
        public string cusname { get; set; }
        public string slmcode { get; set; }
        public string address { get; set; }
        public string address2 { get; set; }
        public string phone { get; set; }
        public string contact { get; set; }
        public int block { get; set; }
        public string inactive { get; set; }
        public string cuskey { get; set; }
        public string cuskeyname { get; set; }
        public string promotiongroup { get; set; }
    }
}
