using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductTabImageModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<ResultProductTabImageList> result { get; set; }
    }
    public class ResultProductTabImageList
    {
        public string stkcode { get; set; }
        public int seqImage { get; set; }
        public string filename { get; set; }
        public string url { get; set; }
        public string imagePath { get; set; }
        public string insertedBy { get; set; }
        public string insertedDate { get; set; }
        public string updatedBy { get; set; }
        public string updatedDate { get; set; }
    }
}
