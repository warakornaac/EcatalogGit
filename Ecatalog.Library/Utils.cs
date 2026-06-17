using System;
using System.Web;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Xml.Linq;
using Ecatalog.Models;
using Ecatalog.Library;
using System.Threading.Tasks;
using Ecatalog.Library.Services;

namespace Ecatalog.Library
{
    public class Utils
    {
        public static string SessionUsername {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["username"]);
            }
        }

        public static string SessionEmail {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["email"]);
            }
        }

        public static string SessionUserType {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["UserType"]);
            }
        }

        public static string SessionSlmCode {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["slmcode"]);
            }
        }

        public static string SessionCusCode {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["cuscode"]);
            }
        }

        public static string SessionIsActive {
            get {
                return Convert.ToString(
                    HttpContext.Current.Session["isActive"]);
            }
        }

        public static bool IsLogin {
            get {
                return !string.IsNullOrEmpty(
                    SessionUsername);
            }
        }

        public static void Logout() {
            HttpContext.Current.Session.Clear();
            HttpContext.Current.Session.Abandon();
        }
        public static int CInt(object value) {
            if (value == null)
                return (0);

            var data = value.ToString();
            data = data.Replace(",", "");
            var isNum = new System.Text.RegularExpressions.Regex("^([-]|[0-9])[0-9]*$");
            var m = isNum.Match(data);
            return m.Success ? (Convert.ToInt32(data)) : (0);
        }

        public static long CLong(object value) {
            if (value == null)
                return (0);

            var data = value.ToString();
            data = data.Replace(",", "");
            var isNum = new System.Text.RegularExpressions.Regex("^([-]|[0-9])[0-9]*$");
            var m = isNum.Match(data);
            return m.Success ? (Convert.ToInt64(data)) : (0);
        }

        public static double CDouble(object value) {
            var data = value.ToString();
            data = data.Replace(",", "");
            var isNum = new System.Text.RegularExpressions.Regex("^([-]|[.]|[-.]|[0-9])[0-9]*[.]*[0-9]+$|^([-]|[0-9])[0-9]*$");
            var m = isNum.Match(data);
            return m.Success ? (Convert.ToDouble(data)) : (0.00);
        }

        public static decimal CDecimal(object value) {
            var data = value.ToString();
            data = data.ToString(CultureInfo.InvariantCulture).Replace(",", "");
            var isNum = new System.Text.RegularExpressions.Regex("^([-]|[.]|[-.]|[0-9])[0-9]*[.]*[0-9]+$|^([-]|[0-9])[0-9]*$");
            var m = isNum.Match(data);
            return m.Success ? (Convert.ToDecimal(data)) : (Convert.ToDecimal("0.00"));
        }

        public static string GetPathOf(string fullpath) {
            var lastIdx = fullpath.LastIndexOf("\\", StringComparison.Ordinal);
            return (fullpath.Substring(0, lastIdx));
        }

        public static void ByteToFile(byte[] buffer, string targetFile) {
            try {
                var stf = new MemoryStream(buffer);
                var stt = File.Create(targetFile);
                var br = new BinaryReader(stf);
                var bw = new BinaryWriter(stt);
                bw.Write(br.ReadBytes((int)stf.Length));
                bw.Flush();
                bw.Close();
                br.Close();
                stf = null;
                stt = null;
            }
            catch (Exception ex) {
                throw (ex);
            }
        }

        public static byte[] FileToByte(string sourceFile) {
            try {
                var b = File.ReadAllBytes(sourceFile);
                return (b);
            }
            catch (Exception ex) {
                throw (ex);
            }
        }

        public static string GetConfig(string key) {
            var value = ConfigurationManager.AppSettings[key];
            if (string.IsNullOrWhiteSpace(value)) { 
                throw new Exception($"AppSettings key '{key}' not found.");
            }
            return value;
        }

        public static string Left(string str, int length) {
            return str.Substring(0, Math.Min(length, str.Length));
        }

        public static string Right(string original, int numberCharacters) {
            return original.Substring(numberCharacters > original.Length ? 0 : original.Length - numberCharacters);
        }

        public static string ConvertDatetime(string date) {
            var stratDate = date.Split('/');
            string newDate = new DateTime(Convert.ToInt32(stratDate[2]) - 543, Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[0])).ToString("yyyy-MM-dd", new CultureInfo("en-US"));

            return newDate;

        }

        public static string ConvertDatetimeToString(DateTime datetime) {
            return datetime.Date.ToString("dd/MM/yyyy", new CultureInfo("th-TH"));
        }

        public static DateTime ConvertStringToDatetime(string datetime) {
            var stratDate = datetime.Split('/');

            return new DateTime(Convert.ToInt32(stratDate[2]) - 543, Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[0]));

            //var stratDate = datetime.Split('-');
            //string newDate = new DateTime(Convert.ToInt32(stratDate[0]) + 543, Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[2])).ToString("dd/MM/yyyy", new CultureInfo("en-TH"));

            //return newDate;
        }

        public static DateTime ConvertStringToDatetimeEn(string datetime) {
            var stratDate = datetime.Split('-');

            return new DateTime(Convert.ToInt32(stratDate[0]), Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[2]));

            //var stratDate = datetime.Split('-');
            //string newDate = new DateTime(Convert.ToInt32(stratDate[0]) + 543, Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[2])).ToString("dd/MM/yyyy", new CultureInfo("en-TH"));

            //return newDate;
        }

        public static DateTime ConvertStringToDatetimeEnSlash(DateTime datetime) {
            var stratDate = datetime.ToString().Split('/');

            return new DateTime(Convert.ToInt32(stratDate[0]), Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[2]));

        }
        public static string ConvertTimeToString(DateTime datetime) {
            return datetime.ToString("H:mm", new CultureInfo("th-TH"));
        }

        public static DateTime ConvertStringToDatetimeEmail(string datetime) {
            var stratDate = datetime.Split('/');
            var strYear = stratDate[2].ToString().Split(' ');
            var strTime = strYear[1].ToString().Split(':');

            DateTime dateTime = new DateTime(Convert.ToInt32(strYear[0]) - 543, Convert.ToInt32(stratDate[1]), Convert.ToInt32(stratDate[0]), Convert.ToInt32(strTime[0]) + 7, Convert.ToInt32(strTime[1]), Convert.ToInt32(strTime[2]));
            return dateTime;
        }


        //Implemented based on interface, not part of algorithm
        public static string RemoveAllNamespaces(string xmlDocument) {
            XElement xmlDocumentWithoutNs = RemoveAllNamespaces(XElement.Parse(xmlDocument));

            return xmlDocumentWithoutNs.ToString();
        }

        //Core recursion function
        private static XElement RemoveAllNamespaces(XElement xmlDocument) {
            if (!xmlDocument.HasElements) {
                XElement xElement = new XElement(xmlDocument.Name.LocalName);
                xElement.Value = xmlDocument.Value;

                foreach (XAttribute attribute in xmlDocument.Attributes())
                    xElement.Add(attribute);

                return xElement;
            }
            return new XElement(xmlDocument.Name.LocalName, xmlDocument.Elements().Select(el => RemoveAllNamespaces(el)));
        }


        //get name month
        public Array ListMonth(string language = "EN", string format = "S") {
            var arrayMonth = new string[12];
            if (language == "EN") {
                if (format == "S") {
                    arrayMonth = new string[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
                }
            }
            return (arrayMonth);
        }
        public List<DateTime> getAllDates(int year, int month) {
            var ret = new List<DateTime>();
            for (int i = 1; i <= DateTime.DaysInMonth(year, month); i++) {
                ret.Add(new DateTime(year, month, i));
            }
            return ret;
        }
        public static async Task<T> CallApiAsync<T>(
           string url,
           string method,
           object dataParam = null) {
            string baseUrl = "https://localhost:44361/";
            ApiGatewayService api = new ApiGatewayService();

            var request =
                new ApiRequestModel {
                    Url = baseUrl + url,
                    Method = method,
                    // FIX AUTH
                    Username = Utils.GetConfig("ApiUsername"),
                    Password = Utils.GetConfig("ApiPassword"),
                    ApiKey = Utils.GetConfig("ApiKey"),
                    // CACHE
                    UseCache = false,
                    CacheMinutes = 10,

                    DataParam = dataParam
                };

            var result = await api.SendAsync<T>(request);

            if (!result.IsSuccess) {
                throw new System.Exception(
                    result.ErrorMessage
                );
            }

            return result.Data;
        }
        public static async Task<ApiResponseModel<T>> CallApiAsyncMemory<T>(
         string url,
         string method,
         object dataParam = null,
         bool useCache = false,
         int cacheMinutes = 10) {
            ApiGatewayService api = new ApiGatewayService();

            var request =
                new ApiRequestModel {
                    Url = Utils.GetConfig("ApiUrlService") + url,
                    Method = method,
                    Username = Utils.GetConfig("ApiUsername"),
                    Password = Utils.GetConfig("ApiPassword"),
                    ApiKey = Utils.GetConfig("ApiKey"),
                    UseCache = useCache,
                    CacheMinutes = cacheMinutes,
                    DataParam = dataParam
                };

            var result = await api.SendAsync<T>(request);

            return result;
        }
    }
}
