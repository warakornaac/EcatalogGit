using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class SearchLogModel
    {
        // User
        public string UserId { get; set; }
        public string UserType { get; set; }

        // Search
        public string SearchType { get; set; }
        public string SearchText { get; set; }
        public string SearchFields { get; set; }

        // Product filters
        public string ProductGroupId { get; set; }
        public string ProductLineId { get; set; }
        public string BrandId { get; set; }
        public string FittingFilter { get; set; }

        // Vehicle filters
        public string MarketSegmentId { get; set; }
        public string SegmentId { get; set; }
        public string MakerId { get; set; }
        public string RangeId { get; set; }
        public string BodyId { get; set; }
        public string EngineId { get; set; }
        public string YearFrom { get; set; }
        public string YearTo { get; set; }
        public string DriveType { get; set; }

        // Customer / Sales
        public string SlmCode { get; set; }
        public string CusCode { get; set; }
        public string Company { get; set; }

        // Result
        public int ResultCount { get; set; }
        public string SearchStatus { get; set; }

        // Performance
        public int? ResponseTimeMs { get; set; }
    }
}
