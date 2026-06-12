using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ModelEngineFilterModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultEngineList> result { get; set; }

    }
    public class ResultEngineList
    {
        public string id { get; set; }
        public string engineType { get; set; }
        public string fuelType { get; set; }
        public string strokes { get; set; }
        public string makerId { get; set; }
        public string modelRangeId { get; set; }
        public string modelId { get; set; }
        public string bodyId { get; set; }
    }
}
