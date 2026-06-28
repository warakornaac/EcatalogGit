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

        public List<int> searchFields { get; set; }
    }
}
