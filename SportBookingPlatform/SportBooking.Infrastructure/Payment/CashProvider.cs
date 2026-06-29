using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Enums;

namespace SportBooking.Infrastructure.Payment;

public class CashProvider : IPaymentProvider
{
    public PaymentMethod Method => PaymentMethod.Cash;

    public Task<ProviderCreateResult> CreateAsync(ProviderCreateRequest request, CancellationToken ct = default) =>
        Task.FromResult(new ProviderCreateResult(
            Success: true,
            PaymentUrl: null,
            GatewayOrderId: $"CASH-{request.PaymentId:N}"));

    public Task<VerifyCallbackResult> VerifyCallbackAsync(Dictionary<string, string> parameters, CancellationToken ct = default) =>
        Task.FromResult(new VerifyCallbackResult(false, false, null, null, null, "Cash has no callback."));
}