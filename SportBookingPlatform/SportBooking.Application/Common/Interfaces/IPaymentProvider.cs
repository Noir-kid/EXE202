using SportBooking.Domain.Enums;

namespace SportBooking.Application.Common.Interfaces;

public interface IPaymentProvider
{
    PaymentMethod Method { get; }

    /// <summary>Create payment URL / initiate transaction. Returns redirect URL or null for Cash.</summary>
    Task<ProviderCreateResult> CreateAsync(ProviderCreateRequest request, CancellationToken ct = default);

    /// <summary>Verify and parse gateway callback/IPN parameters.</summary>
    Task<VerifyCallbackResult> VerifyCallbackAsync(Dictionary<string, string> parameters, CancellationToken ct = default);
}

public record ProviderCreateRequest(
    Guid PaymentId,
    Guid BookingId,
    decimal Amount,
    string OrderInfo,
    string ReturnUrl,
    string IpnUrl,
    string ClientIp,
    string? GatewayOrderId = null
);

public record ProviderCreateResult(
    bool Success,
    string? PaymentUrl,
    string? GatewayOrderId,
    string? Error = null
);

public record VerifyCallbackResult(
    bool IsValid,
    bool IsSuccess,
    string? GatewayTransactionId,
    string? GatewayOrderId,
    string? ResponseCode,
    string? Message,
    decimal? Amount = null
);