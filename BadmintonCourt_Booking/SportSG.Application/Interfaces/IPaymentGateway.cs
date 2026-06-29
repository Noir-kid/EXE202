namespace SportSG.Application.Interfaces;

public record PaymentRequest(Guid BookingId, decimal Amount, string OrderInfo, string ReturnUrl, string IpAddress);
public record PaymentResult(bool Success, string? PaymentUrl, string? TransactionId, string? Message);
public record PaymentCallback(string RawQuery, string IpAddress);
public record PaymentVerifyResult(bool IsValid, Guid BookingId, decimal Amount, string TransactionId);

public interface IPaymentGateway
{
    string GatewayName { get; }
    Task<PaymentResult> CreatePaymentUrlAsync(PaymentRequest request, CancellationToken ct = default);
    Task<PaymentVerifyResult> VerifyCallbackAsync(PaymentCallback callback, CancellationToken ct = default);
}
