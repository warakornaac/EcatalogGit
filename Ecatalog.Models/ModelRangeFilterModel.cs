using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ModelRangeFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultModelRangeList> result { get; set; }
    }
    public class ResultModelRangeList
    {
        public string Id { get; set; }
        public string Model { get; set; }
        public string MakerId { get; set; }
        public string MarketSegmentId { get; set; }
        public string ModelRangeId { get; set; }
    }
}
