using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ProductSearchCatagoryRequestModel
    {
        public List<int> productGroupId { get; set; }

        public List<int> productLineId { get; set; }

        public List<int> brandId { get; set; }
    }
}
