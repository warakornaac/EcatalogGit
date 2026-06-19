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


    }
}
