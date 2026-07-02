using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class GetInfomantionCustomerModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultGetInfomantionCustomerModel> result { get; set; }

    }
    public class ResultGetInfomantionCustomerModel
    {
        public string cuscode { get; set; }
        public string cusname { get; set; }
        public string pro { get; set; }
        public string address { get; set; }
        public string address2 { get; set; }
        public string custype { get; set; }
        public string slmcode { get; set; }
        public string inactive { get; set; }
        public int block { get; set; }
        public string phone { get; set; }
        public string rating { get; set; }
    }
}