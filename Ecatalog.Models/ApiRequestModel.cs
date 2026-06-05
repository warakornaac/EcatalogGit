using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ApiRequestModel
    {
        public string Url { get; set; }

        public string Method { get; set; }

        public object DataParam { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

        public string ApiKey { get; set; }

        public bool UseCache { get; set; }

        public int CacheMinutes { get; set; }
    }
}
