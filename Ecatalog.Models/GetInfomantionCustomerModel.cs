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
        public string block { get; set; }
        public string aacpaytrm { get; set; }
        public string tacpaytrm { get; set; }
        public string omppaytrm { get; set; }
        public string agspaytrm { get; set; }
        public string phone { get; set; }
        public string rating { get; set; }
        // Credit Line
        public int aaccrline { get; set; }
        public int taccrline { get; set; }
        public int ompcrline { get; set; }
        public int agscrline { get; set; }
        // Balance
        public int aacbal { get; set; }
        public int tacbal { get; set; }
        public int ompbal { get; set; }
        public int agsbal { get; set; }
        // Balance Due
        public int aacbaldue { get; set; }
        public int tacbaldue { get; set; }
        public int ompbaldue { get; set; }
        public int agsbaldue { get; set; }
        // Billing Due Date
        public string aacbildue { get; set; }
        public string tacbildue { get; set; }
        public string ompbildue { get; set; }
        public string agsbildue { get; set; }
    }
}