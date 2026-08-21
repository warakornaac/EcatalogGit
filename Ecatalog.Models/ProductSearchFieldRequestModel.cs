using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductSearchFieldRequestModel
    {
        public string searchText { get; set; }
        public List<string> searchFields { get; set; }
        public string marketSegmentId { get; set; }
        public string segmentId { get; set; }
        public string makerId { get; set; }
        public string rangeId { get; set; }
        public string bodyId { get; set; }
        public string engineId { get; set; }
        public string yearFrom { get; set; }
        public string yearTo { get; set; }
        public string driveType { get; set; }
        public string SlmCode { get; set; }
        public string CusCode { get; set; }
        public List<string> Company { get; set; }
    }
}
