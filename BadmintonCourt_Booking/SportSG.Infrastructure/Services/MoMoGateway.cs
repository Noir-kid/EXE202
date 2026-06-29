using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

public class MoMoGateway(IConfiguration cfg, IHttpClientFactory httpFactory) : IPaymentGateway
{
    public string GatewayName => "MoMo";

    private readonly string _partnerCode = cfg["MoMo:PartnerCode"] ?? "";
    private readonly string _accessKey   = cfg["MoMo:AccessKey"]   ?? "";
    private readonly string _secretKey   = cfg["MoMo:SecretKey"]   ?? "";
    private readonly string _endpoint    = cfg["MoMo:Endpoint"]    ?? "https://test-payment.momo.vn/v2/gateway/api/create";

    public async Task<PaymentResult> CreatePaymentUrlAsync(PaymentRequest request, CancellationToken ct = default)
    {
        var orderId   = $"SPORTSG_{request.BookingId:N}";
        var requestId = Guid.NewGuid().ToString("N");
        var amount    = (long)request.Amount;

        var rawHash = $"accessKey={_accessKey}&amount={amount}&extraData=" +
                      $"&ipnUrl={request.ReturnUrl}&orderId={orderId}&orderInfo={request.OrderInfo}" +
                      $"&partnerCode={_partnerCode}&redirectUrl={request.ReturnUrl}" +
                      $"&requestId={requestId}&requestType=payWithMethod";

        var signature = HmacSha256(_secretKey, rawHash);

        var body = new
        {
            partnerCode = _partnerCode,
            accessKey   = _accessKey,
            requestId,
            amount,
            orderId,
            orderInfo   = request.OrderInfo,
            redirectUrl = request.ReturnUrl,
            ipnUrl      = request.ReturnUrl,
            extraData   = "",
            requestType = "payWithMethod",
            signature,
            lang        = "vi",
        };

        using var client = httpFactory.CreateClient();
        var resp = await client.PostAsJsonAsync(_endpoint, body, ct);
        resp.EnsureSuccessStatusCode();

        var result = await resp.Content.ReadFromJsonAsync<MoMoResponse>(cancellationToken: ct);
        var ok = result?.ResultCode == 0;
        return new PaymentResult(ok, result?.PayUrl, orderId, result?.Message);
    }

    public Task<PaymentVerifyResult> VerifyCallbackAsync(PaymentCallback callback, CancellationToken ct = default)
    {
        var parts = callback.RawQuery.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(p => p[0], p => Uri.UnescapeDataString(p[1]));

        parts.TryGetValue("signature", out var sig);
        parts.TryGetValue("resultCode", out var code);
        parts.TryGetValue("orderId", out var orderId);
        parts.TryGetValue("amount", out var amtStr);

        var rawHash = $"accessKey={_accessKey}&amount={amtStr}&extraData=" +
                      $"&message={parts.GetValueOrDefault("message")}" +
                      $"&orderId={orderId}&orderInfo={parts.GetValueOrDefault("orderInfo")}" +
                      $"&orderType={parts.GetValueOrDefault("orderType")}" +
                      $"&partnerCode={_partnerCode}&payType={parts.GetValueOrDefault("payType")}" +
                      $"&requestId={parts.GetValueOrDefault("requestId")}" +
                      $"&responseTime={parts.GetValueOrDefault("responseTime")}" +
                      $"&resultCode={code}&transId={parts.GetValueOrDefault("transId")}";

        var expected = HmacSha256(_secretKey, rawHash);
        var isValid  = string.Equals(expected, sig, StringComparison.OrdinalIgnoreCase) && code == "0";

        // orderId format: SPORTSG_{bookingId:N}
        var guidPart = orderId?.Replace("SPORTSG_", "");
        var bookingId = !string.IsNullOrEmpty(guidPart) && guidPart.Length == 32
            ? Guid.ParseExact(guidPart, "N") : Guid.Empty;
        decimal.TryParse(amtStr, out var amt);

        return Task.FromResult(new PaymentVerifyResult(isValid, bookingId, amt, orderId ?? ""));
    }

    private static string HmacSha256(string key, string data)
    {
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLower();
    }

    private record MoMoResponse(int ResultCode, string? PayUrl, string? Message);
}
