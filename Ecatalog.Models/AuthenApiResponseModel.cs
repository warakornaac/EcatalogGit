using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Ecatalog.Models
{
    public class AuthenApiResponseModel
    {
        public int statusCode { get; set; }
        public string errorMessage { get; set; }
        public List<AuthenUserModel> result { get; set; }
    }
    public class AuthenUserModel
    {
        public string verify { get; set; }

        public string username { get; set; }

        public string email { get; set; }

        public string slmcode { get; set; }

        public string cuscode { get; set; }

        public int userType { get; set; }

        public string isActive { get; set; }
    }
}
