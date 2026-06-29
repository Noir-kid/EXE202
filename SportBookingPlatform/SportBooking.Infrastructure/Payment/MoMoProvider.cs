using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Enums;

namespace SportBooking.Infrastructure.Payment;

public class MoMoProvider(IConfiguration config, ILogger<MoMoProvider> logger, IHttpClientFactory httpClientFactory)
    : IPaymentProvider
{
    private readonly string _partnerCode = config["Payment:MoMo:PartnerCode"] ?? throw new InvalidOperationException("MoMo PartnerCode not configured.");
    private readonly string _accessKey = config["Payment:MoMo:AccessKey"] ?? throw new InvalidOperationException("MoMo AccessKey not configured.");
    private readonly string _secretKey = config["Payment:MoMo:SecretKey"] ?? throw new InvalidOperationException("MoMo SecretKey not configured.");
    private readonly string _apiEndpoint = config["Payment:MoMo:ApiEndpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";

    public PaymentMethod Method => PaymentMethod.MoMo;

    public async Task<ProviderCreateResult> CreateAsync(ProviderCreateRequest request, CancellationToken ct = default)
    {
        var requestId = Guid.NewGuid().ToString("N");
        var orderId = request.GatewayOrderId ?? request.PaymentId.ToString("N");
        var amountLong = (long)request.Amount;
        var extraData = string.Empty;

        var rawSignature = $"accessKey={_accessKey}&amount={amountLong}&extraData={extraData}" +
                           $"&ipnUrl={request.IpnUrl}&orderId={orderId}&orderInfo={request.OrderInfo}" +
                           $"&partnerCode={_partnerCode}&redirectUrl={request.ReturnUrl}" +
                           $"&requestId={requestId}&requestType=payWithMethod";

        var signature = HmacSha256(_secretKey, rawSignature);

        var payload = new
        {
            partnerCode = _partnerCode,
            requestType = "payWithMethod",
            ipnUrl = request.IpnUrl,
            redirectUrl = request.ReturnUrl,
            orderId,
            amount = amountLong,
            orderInfo = request.OrderInfo,
            requestId,
            extraData,
            lang = "vi",
            signature
        };

        try
        {
            var client = httpClientFactory.CreateClient("MoMo");
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await client.PostAsync(_apiEndpoint, content, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            var resultCode = root.GetProperty("resultCode").GetInt32();
            var payUrl = root.TryGetProperty("payUrl", out var urlProp) ? urlProp.GetString() : null;

            return resultCode == 0
                ? new ProviderCreateResult(true, payUrl, orderId)
                : new ProviderCreateResult(false, null, orderId, $"MoMo error: {resultCode}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MoMo CreatePayment failed for orderId {OrderId}", orderId);
            return new ProviderCreateResult(false, null, orderId, ex.Message);
        }
    }

    public Task<VerifyCallbackResult> VerifyCallbackAsync(Dictionary<string, string> parameters, CancellationToken ct = default)
    {
        if (!parameters.TryGetValue("signature", out var receivedSignature))
            return Task.FromResult(new VerifyCallbackResult(false, false, null, null, null, "Missing signature."));

        var partnerCode = parameters.GetValueOrDefault("partnerCode", string.Empty);
        var orderId = parameters.GetValueOrDefault("orderId", string.Empty);
        var requestId = parameters.GetValueOrDefault("requestId", string.Empty);
        var amount = parameters.GetValueOrDefault("amount", "0");
        var orderInfo = parameters.GetValueOrDefault("orderInfo", string.Empty);
        var orderType = parameters.GetValueOrDefault("orderType", string.Empty);
        var transId = parameters.GetValueOrDefault("transId", string.Empty);
        var resultCode = parameters.GetValueOrDefault("resultCode", "99");
        var message = parameters.GetValueOrDefault("message", string.Empty);
        var payType = parameters.GetValueOrDefault("payType", string.Empty);
        var responseTime = parameters.GetValueOrDefault("responseTime", "0");
        var extraData = parameters.GetValueOrDefault("extraData", string.Empty);

        var rawSignature = $"accessKey={_accessKey}&amount={amount}&extraData={extraData}" +
                           $"&message={message}&orderId={orderId}&orderInfo={orderInfo}" +
                           $"&orderType={orderType}&partnerCode={partnerCode}&payType={payType}" +
                           $"&requestId={requestId}&responseTime={responseTime}" +
                           $"&resultCode={resultCode}&transId={transId}";

        var expectedSignature = HmacSha256(_secretKey, rawSignature);
        var isValid = string.Equals(receivedSignature, expectedSignature, StringComparison.Ordinal);
        var isSuccess = isValid && resultCode == "0";

        return Task.FromResult(new VerifyCallbackResult(
            IsValid: isValid, IsSuccess: isSuccess,
            GatewayTransactionId: transId, GatewayOrderId: orderId,
            ResponseCode: resultCode,
            Message: isSuccess ? "Payment successful." : message,
            Amount: decimal.TryParse(amount, out var a) ? a : null));
    }

    private static string HmacSha256(string key, string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(data))).ToLower();
    }
}