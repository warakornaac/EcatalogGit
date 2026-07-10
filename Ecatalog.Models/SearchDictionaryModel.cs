using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class SearchDictionaryModel
    {
        public int Id { get; set; }

        public string Keyword { get; set; }

        public string Normalize { get; set; }

        public string SearchType { get; set; }

        public string SourceTable { get; set; }

        public int Priority { get; set; }

        public string LanguageCode { get; set; }

        public bool IsActive { get; set; }

        public DateTime InsertedDate { get; set; }
    }
}
