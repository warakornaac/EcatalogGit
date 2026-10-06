using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class InsertLogAuthenLogin
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public InsertLogAuthenLoginResult result { get; set; }
    }
    public class InsertLogAuthenLoginResult
    {
    }
}
