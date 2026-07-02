using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

/// <summary>
/// PayOS payment link gateway. PayOS orderCode is numeric, so callers resolve
/// BookingId by looking up Payment.TransactionRef.
/// </summary>
public class PayOSGateway(IConfiguration cfg, IHttpClientFactory httpFactory) : IPaymentGateway
{
    public string GatewayName => "PayOS";

    private readonly string _clientId = cfg["PayOS:ClientId"] ?? "";
    private readonly string _apiKey = cfg["PayOS:ApiKey"] ?? "";
    private readonly string _checksumKey = cfg["PayOS:ChecksumKey"] ?? "";
    private readonly string _endpoint = cfg["PayOS:Endpoint"] ?? "https://api-merchant.payos.vn";
    private readonly string _cancelUrl = cfg["PayOS:CancelUrl"] ?? "";

    public async Task<PaymentResult> CreatePaymentUrlAsync(PaymentRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_clientId) ||
            string.IsNullOrWhiteSpace(_apiKey) ||
            string.IsNullOrWhiteSpace(_checksumKey))
        {
            return new PaymentResult(false, null, null, "PayOS chưa được cấu hình đầy đủ.");
        }

        var amount = decimal.ToInt64(decimal.Round(request.Amount, 0, MidpointRounding.AwayFromZero));
        var orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 100 + Random.Shared.Next(0, 100);
        var description = $"SportSG {request.BookingId:N}"[..25];
        var returnUrl = request.ReturnUrl;
        var cancelUrl = string.IsNullOrWhiteSpace(_cancelUrl) ? request.ReturnUrl : _cancelUrl;
        var orderCodeText = orderCode.ToString(CultureInfo.InvariantCulture);

        var signData = BuildSignatureData(new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["amount"] = amount.ToString(CultureInfo.InvariantCulture),
            ["cancelUrl"] = cancelUrl,
            ["description"] = description,
            ["orderCode"] = orderCodeText,
            ["returnUrl"] = returnUrl,
        });

        var itemName = request.OrderInfo.Length > 50 ? request.OrderInfo[..50] : request.OrderInfo;
        var body = new
        {
            orderCode,
            amount,
            description,
            returnUrl,
            cancelUrl,
            items = new[]
            {
                new
                {
                    name = itemName,
                    quantity = 1,
                    price = amount,
                }
            },
            signature = HmacSha256(_checksumKey, signData),
        };

        using var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-client-id", _clientId);
        client.DefaultRequestHeaders.Add("x-api-key", _apiKey);

        using var resp = await client.PostAsJsonAsync(PaymentRequestsEndpoint, body, ct);
        var result = await resp.Content.ReadFromJsonAsync<PayOSCreateResponse>(cancellationToken: ct);

        if (!resp.IsSuccessStatusCode)
        {
            return new PaymentResult(false, null, null, result?.Desc ?? "PayOS không phản hồi thành công.");
        }

        var ok = result?.Code == "00" && !string.IsNullOrWhiteSpace(result.Data?.CheckoutUrl);
        return new PaymentResult(ok, result?.Data?.CheckoutUrl, orderCodeText, result?.Desc);
    }

    public async Task<PaymentVerifyResult> GetPaymentStatusAsync(string orderCode, CancellationToken ct = default)
    {
        using var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-client-id", _clientId);
        client.DefaultRequestHeaders.Add("x-api-key", _apiKey);

        var resp = await client.GetAsync($"{PaymentRequestsEndpoint}/{orderCode}", ct);
        if (!resp.IsSuccessStatusCode)
            return new PaymentVerifyResult(false, Guid.Empty, 0, orderCode);

        var result = await resp.Content.ReadFromJsonAsync<PayOSStatusResponse>(cancellationToken: ct);
        var isValid = result?.Code == "00" && result.Data?.Status == "PAID";
        var amount = result?.Data?.Amount ?? 0m;

        return new PaymentVerifyResult(isValid, Guid.Empty, amount, orderCode);
    }

    public Task<PaymentVerifyResult> VerifyCallbackAsync(PaymentCallback callback, CancellationToken ct = default)
    {
        var raw = callback.RawQuery.Trim();
        if (raw.StartsWith("{", StringComparison.Ordinal))
            return Task.FromResult(VerifyJsonPayload(raw));

        return Task.FromResult(VerifyQueryPayload(raw));
    }

    private string PaymentRequestsEndpoint
    {
        get
        {
            var endpoint = _endpoint.TrimEnd('/');
            return endpoint.EndsWith("/v2/payment-requests", StringComparison.OrdinalIgnoreCase)
                ? endpoint
                : $"{endpoint}/v2/payment-requests";
        }
    }

    private PaymentVerifyResult VerifyJsonPayload(string rawJson)
    {
        using var doc = JsonDocument.Parse(rawJson);
        var root = doc.RootElement;

        if (!root.TryGetProperty("data", out var data) || !root.TryGetProperty("signature", out var sigEl))
            return new PaymentVerifyResult(false, Guid.Empty, 0, "");

        var fields = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var prop in data.EnumerateObject())
            fields[prop.Name] = PayOSFieldToString(prop.Value);

        var receivedSig = sigEl.GetString() ?? "";
        var expected = HmacSha256(_checksumKey, BuildSignatureData(fields));
        var success = root.TryGetProperty("success", out var s) && s.ValueKind == JsonValueKind.True;
        var isValid = string.Equals(expected, receivedSig, StringComparison.OrdinalIgnoreCase) && success;

        var orderCode = fields.GetValueOrDefault("orderCode") ?? "";
        var amountText = fields.GetValueOrDefault("amount");
        decimal.TryParse(amountText, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount);

        return new PaymentVerifyResult(isValid, Guid.Empty, amount, orderCode);
    }

    private PaymentVerifyResult VerifyQueryPayload(string rawQuery)
    {
        var parts = rawQuery.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(p => p[0], p => Uri.UnescapeDataString(p[1]));

        parts.TryGetValue("signature", out var receivedSignature);
        parts.TryGetValue("amount", out var amountText);
        parts.TryGetValue("orderCode", out var orderCode);
        parts.TryGetValue("code", out var paymentCode);
        parts.TryGetValue("desc", out var paymentDesc);

        var data = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var part in parts)
        {
            if (part.Key == "signature") continue;
            data[part.Key] = part.Value;
        }

        var expectedSignature = HmacSha256(_checksumKey, BuildSignatureData(data));
        var isPaid = paymentCode == "00" ||
            string.Equals(paymentDesc, "success", StringComparison.OrdinalIgnoreCase);
        var isValid = string.Equals(expectedSignature, receivedSignature, StringComparison.OrdinalIgnoreCase) && isPaid;
        decimal.TryParse(amountText, NumberStyles.Number, CultureInfo.InvariantCulture, out var amount);

        return new PaymentVerifyResult(isValid, Guid.Empty, amount, orderCode ?? "");
    }

    private static string BuildSignatureData(SortedDictionary<string, string> data)
    {
        return string.Join("&", data.Select(kv => $"{kv.Key}={kv.Value}"));
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
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private sealed record PayOSCreateResponse(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("desc")] string? Desc,
        [property: JsonPropertyName("data")] PayOSCreateData? Data);

    private sealed record PayOSCreateData(
        [property: JsonPropertyName("checkoutUrl")] string? CheckoutUrl,
        [property: JsonPropertyName("paymentLinkId")] string? PaymentLinkId);

    private sealed record PayOSStatusResponse(
        [property: JsonPropertyName("code")] string Code,
        [property: JsonPropertyName("data")] PayOSStatusData? Data);

    private sealed record PayOSStatusData(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("amount")] decimal Amount);
}
