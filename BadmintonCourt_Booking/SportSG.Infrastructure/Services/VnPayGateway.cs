using System.Net;
using System.Security.Cryptography;
using System.Text;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

public class VnPayGateway(IConfiguration cfg) : IPaymentGateway
{
    public string GatewayName => "VNPay";

    private readonly string _tmnCode   = cfg["VnPay:TmnCode"]   ?? "";
    private readonly string _hashSecret = cfg["VnPay:HashSecret"] ?? "";
    private readonly string _baseUrl    = cfg["VnPay:BaseUrl"]   ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private readonly string _version    = cfg["VnPay:Version"]   ?? "2.1.0";

    public Task<PaymentResult> CreatePaymentUrlAsync(PaymentRequest request, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow.AddHours(7); // ICT
        var txRef = $"{request.BookingId:N}{now:yyyyMMddHHmmss}";

        var data = new SortedDictionary<string, string>
        {
            ["vnp_Version"]     = _version,
            ["vnp_Command"]     = "pay",
            ["vnp_TmnCode"]     = _tmnCode,
            ["vnp_Amount"]      = ((long)(request.Amount * 100)).ToString(),
            ["vnp_CurrCode"]    = "VND",
            ["vnp_TxnRef"]      = txRef,
            ["vnp_OrderInfo"]   = request.OrderInfo,
            ["vnp_OrderType"]   = "other",
            ["vnp_Locale"]      = "vn",
            ["vnp_ReturnUrl"]   = request.ReturnUrl,
            ["vnp_IpAddr"]      = request.IpAddress,
            ["vnp_CreateDate"]  = now.ToString("yyyyMMddHHmmss"),
        };

        var query  = string.Join("&", data.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));
        var sign   = HmacSha512(_hashSecret, query);
        var payUrl = $"{_baseUrl}?{query}&vnp_SecureHash={sign}";

        return Task.FromResult(new PaymentResult(true, payUrl, txRef, null));
    }

    public Task<PaymentVerifyResult> VerifyCallbackAsync(PaymentCallback callback, CancellationToken ct = default)
    {
        var parts = callback.RawQuery.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(p => p[0], p => WebUtility.UrlDecode(p[1]));

        parts.TryGetValue("vnp_SecureHash", out var receivedHash);
        var data = new SortedDictionary<string, string>(
            parts.Where(kv => kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                 .ToDictionary(kv => kv.Key, kv => kv.Value));

        var query    = string.Join("&", data.Select(kv => $"{kv.Key}={WebUtility.UrlEncode(kv.Value)}"));
        var expected = HmacSha512(_hashSecret, query);
        var isValid  = string.Equals(expected, receivedHash, StringComparison.OrdinalIgnoreCase)
                       && parts.GetValueOrDefault("vnp_ResponseCode") == "00";

        parts.TryGetValue("vnp_TxnRef", out var txRef);
        parts.TryGetValue("vnp_Amount", out var amtStr);
        var bookingId = txRef?.Length >= 32 ? Guid.ParseExact(txRef[..32], "N") : Guid.Empty;
        decimal.TryParse(amtStr, out var amtRaw);

        return Task.FromResult(new PaymentVerifyResult(isValid, bookingId, amtRaw / 100, txRef ?? ""));
    }

    private static string HmacSha512(string key, string data)
    {
        var hash = HMACSHA512.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLower();
    }
}
