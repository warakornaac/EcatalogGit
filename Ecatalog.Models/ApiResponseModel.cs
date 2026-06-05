using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class ApiResponseModel<T>
    {
        public bool IsSuccess { get; set; }

        public int StatusCode { get; set; }

        public string ErrorMessage { get; set; }

        public bool IsFromCache { get; set; }

        public long ExecutionTime { get; set; }

        public T Data { get; set; }
    }
}
