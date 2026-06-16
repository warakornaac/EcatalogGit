using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabCompetitorModel
    {

        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabCompetitorList> result { get; set; }
    }
    public class ResultProductTabCompetitorList
    {
        public string stkcode { get; set; }
        public int seqCompetitor { get; set; }
        public string partNo { get; set; }
        public string brandName { get; set; }
        public string insertedBy { get; set; }
        public string insertedDate { get; set; }
        public string updatedBy { get; set; }
        public string updatedDate { get; set; }
    }
}
