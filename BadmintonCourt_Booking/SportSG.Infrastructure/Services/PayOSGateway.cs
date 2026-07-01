using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

/// <summary>
/// PayOS (payos.vn) payment link gateway.
/// Docs: https://payos.vn/docs/api/
/// Unlike VNPay/MoMo, PayOS's orderCode is a plain number (no room to embed
/// the booking Guid), so VerifyCallbackAsync cannot resolve BookingId on its
/// own — the caller must look up the Payment row by TransactionRef (orderCode)
/// to find the BookingId. See PaymentController.PayOSCallback.
/// </summary>
public class PayOSGateway(IConfiguration cfg, IHttpClientFactory httpFactory) : IPaymentGateway
{
    public string GatewayName => "PayOS";

    private readonly string _clientId    = cfg["PayOS:ClientId"]    ?? "";
    private readonly string _apiKey      = cfg["PayOS:ApiKey"]      ?? "";
    private readonly string _checksumKey = cfg["PayOS:ChecksumKey"] ?? "";
    private readonly string _endpoint    = cfg["PayOS:Endpoint"]    ?? "https://api-merchant.payos.vn";

    public async Task<PaymentResult> CreatePaymentUrlAsync(PaymentRequest request, CancellationToken ct = default)
    {
        // orderCode must be a positive number that fits a JS-safe integer (PayOS's SDK/dashboard use JS numbers).
        var orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds() * 10000 + Random.Shared.Next(0, 9999);
        var amount    = (int)request.Amount;
        // PayOS caps description at 25 chars.
        var description = request.OrderInfo.Length > 25 ? request.OrderInfo[..25] : request.OrderInfo;

        var signData = $"amount={amount}&cancelUrl={request.ReturnUrl}&description={description}" +
                        $"&orderCode={orderCode}&returnUrl={request.ReturnUrl}";
        var signature = HmacSha256(_checksumKey, signData);

        var body = new
        {
            orderCode,
            amount,
            description,
            returnUrl = request.ReturnUrl,
            cancelUrl = request.ReturnUrl,
            signature,
        };

        using var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-client-id", _clientId);
        client.DefaultRequestHeaders.Add("x-api-key",  _apiKey);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var resp = await client.PostAsJsonAsync($"{_endpoint}/v2/payment-requests", body, ct);
        var result = await resp.Content.ReadFromJsonAsync<PayOSResponse>(cancellationToken: ct);

        var ok = resp.IsSuccessStatusCode && result?.Code == "00" && result.Data is not null;
        return new PaymentResult(ok, result?.Data?.CheckoutUrl, orderCode.ToString(), result?.Desc);
    }

    /// <summary>
    /// Actively queries PayOS for the real status of a payment link.
    /// Used as the primary confirmation path from the browser redirect, since the
    /// webhook (VerifyCallbackAsync) requires a publicly reachable URL registered
    /// on the PayOS dashboard — exactly the same limitation VNPay's IPN has locally.
    /// </summary>
    public async Task<PaymentVerifyResult> GetPaymentStatusAsync(string orderCode, CancellationToken ct = default)
    {
        using var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-client-id", _clientId);
        client.DefaultRequestHeaders.Add("x-api-key",  _apiKey);

        var resp = await client.GetAsync($"{_endpoint}/v2/payment-requests/{orderCode}", ct);
        if (!resp.IsSuccessStatusCode)
            return new PaymentVerifyResult(false, Guid.Empty, 0, orderCode);

        var result  = await resp.Content.ReadFromJsonAsync<PayOSStatusResponse>(cancellationToken: ct);
        var isValid = result?.Code == "00" && result.Data?.Status == "PAID";
        var amount  = result?.Data?.Amount ?? 0m;

        return new PaymentVerifyResult(isValid, Guid.Empty, amount, orderCode);
    }

    public Task<PaymentVerifyResult> VerifyCallbackAsync(PaymentCallback callback, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(callback.RawQuery);
        var root = doc.RootElement;

        if (!root.TryGetProperty("data", out var data) || !root.TryGetProperty("signature", out var sigEl))
            return Task.FromResult(new PaymentVerifyResult(false, Guid.Empty, 0, ""));

        var receivedSig = sigEl.GetString() ?? "";

        // Signature covers the flat "data" object's fields, sorted alphabetically.
        var fields = data.EnumerateObject()
            .OrderBy(p => p.Name, StringComparer.Ordinal)
            .Select(p => $"{p.Name}={PayOSFieldToString(p.Value)}");
        var signData = string.Join('&', fields);
        var expected = HmacSha256(_checksumKey, signData);

        var success = root.TryGetProperty("success", out var s) && s.ValueKind == JsonValueKind.True;
        var isValid = string.Equals(expected, receivedSig, StringComparison.OrdinalIgnoreCase) && success;

        var orderCode = data.TryGetProperty("orderCode", out var oc) ? oc.ToString() : "";
        var amount    = data.TryGetProperty("amount", out var amt) && amt.TryGetDecimal(out var d) ? d : 0m;

        // BookingId can't be derived from a numeric orderCode — caller resolves it via TransactionRef lookup.
        return Task.FromResult(new PaymentVerifyResult(isValid, Guid.Empty, amount, orderCode));
    }

    private static string PayOSFieldToString(JsonElement el) => el.ValueKind switch
    {
        JsonValueKind.Null => "",
        JsonValueKind.String => el.GetString() ?? "",
        _ => el.ToString(),
    };

    private static string HmacSha256(string key, string data)
    {
        var hash = HMACSHA256.HashData(Encoding.UTF8.GetBytes(key), Encoding.UTF8.GetBytes(data));
        return Convert.ToHexString(hash).ToLower();
    }

    private record PayOSResponse(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("desc")] string? Desc,
        [property: JsonPropertyName("data")] PayOSData? Data);

    private record PayOSData(
        [property: JsonPropertyName("checkoutUrl")]   string? CheckoutUrl,
        [property: JsonPropertyName("orderCode")]     long OrderCode,
        [property: JsonPropertyName("paymentLinkId")] string? PaymentLinkId);

    private record PayOSStatusResponse(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("data")] PayOSStatusData? Data);

    private record PayOSStatusData(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("amount")] decimal Amount);
}
