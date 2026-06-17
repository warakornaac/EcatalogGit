using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{

    public class MatchProductGroupModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultMatchList> result { get; set; }
    }
    public class ResultMatchList
    {
        public string prodgrpid { get; set; }
        public string prodlineid { get; set; }

    }
}
