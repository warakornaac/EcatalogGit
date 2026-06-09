using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ModelBodyFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultBodyList> result { get; set; }
    }
    public class ResultBodyList
    {
        public string id { get; set; }
        public string body { get; set; }
        public string bodyType { get; set; }
        public string modelId { get; set; }
        public string modelRangeId { get; set; }
        public string makerId { get; set; }
        public string vehicleSegmentId { get; set; }
        public string marketSegmentId { get; set; }
    }
}
