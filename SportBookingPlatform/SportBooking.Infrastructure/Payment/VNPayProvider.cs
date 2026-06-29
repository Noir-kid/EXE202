using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Enums;

namespace SportBooking.Infrastructure.Payment;

public class VNPayProvider(IConfiguration config) : IPaymentProvider
{
    private readonly string _tmnCode = config["Payment:VNPay:TmnCode"] ?? throw new InvalidOperationException("VNPay TmnCode not configured.");
    private readonly string _hashSecret = config["Payment:VNPay:HashSecret"] ?? throw new InvalidOperationException("VNPay HashSecret not configured.");
    private readonly string _paymentUrl = config["Payment:VNPay:PaymentUrl"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public PaymentMethod Method => PaymentMethod.VNPay;

    public Task<ProviderCreateResult> CreateAsync(ProviderCreateRequest request, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow.AddHours(7);
        var amountInt = (long)(request.Amount * 100);
        var orderId = request.GatewayOrderId ?? request.PaymentId.ToString("N");

        var vnpParams = new SortedDictionary<string, string>
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = _tmnCode,
            ["vnp_Amount"] = amountInt.ToString(),
            ["vnp_CurrCode"] = "VND",
            ["vnp_TxnRef"] = orderId,
            ["vnp_OrderInfo"] = Uri.EscapeDataString(request.OrderInfo),
            ["vnp_OrderType"] = "other",
            ["vnp_Locale"] = "vn",
            ["vnp_ReturnUrl"] = request.ReturnUrl,
            ["vnp_IpAddr"] = request.ClientIp,
            ["vnp_CreateDate"] = now.ToString("yyyyMMddHHmmss"),
            ["vnp_ExpireDate"] = now.AddMinutes(15).ToString("yyyyMMddHHmmss"),
        };

        var queryString = string.Join("&", vnpParams.Select(kv => $"{kv.Key}={kv.Value}"));
        var hash = HmacSha512(_hashSecret, queryString);
        var paymentUrl = $"{_paymentUrl}?{queryString}&vnp_SecureHash={hash}";

        return Task.FromResult(new ProviderCreateResult(true, paymentUrl, orderId));
    }

    public Task<VerifyCallbackResult> VerifyCallbackAsync(Dictionary<string, string> parameters, CancellationToken ct = default)
    {
        if (!parameters.TryGetValue("vnp_SecureHash", out var receivedHash))
            return Task.FromResult(new VerifyCallbackResult(false, false, null, null, null, "Missing signature."));

        var verifyParams = new SortedDictionary<string, string>(
            parameters.Where(kv => kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                      .ToDictionary(kv => kv.Key, kv => kv.Value));

        var queryString = string.Join("&", verifyParams.Select(kv => $"{kv.Key}={kv.Value}"));
        var expectedHash = HmacSha512(_hashSecret, queryString);

        if (!string.Equals(receivedHash, expectedHash, StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(new VerifyCallbackResult(false, false, null, null, null, "Invalid signature."));

        var responseCode = parameters.GetValueOrDefault("vnp_ResponseCode", "99");
        var transId = parameters.GetValueOrDefault("vnp_TransactionNo");
        var orderId = parameters.GetValueOrDefault("vnp_TxnRef");
        var amountStr = parameters.GetValueOrDefault("vnp_Amount", "0");
        decimal amount = decimal.TryParse(amountStr, out var a) ? a / 100 : 0;
        var isSuccess = responseCode == "00";

        return Task.FromResult(new VerifyCallbackResult(
            IsValid: true,
            IsSuccess: isSuccess,
            GatewayTransactionId: transId,
            GatewayOrderId: orderId,
            ResponseCode: responseCode,
            Message: isSuccess ? "Payment successful." : $"VNPay error code: {responseCode}",
            Amount: amount));
    }

    private static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLower();
    }
}