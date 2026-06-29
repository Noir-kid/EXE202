using System.Text.Json;
using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Payments;

public record ProcessCallbackCommand(
    PaymentMethod Method,
    Dictionary<string, string> Parameters
) : IRequest<Result<CallbackResult>>;

public record CallbackResult(bool IsSuccess, string Message, Guid? PaymentId = null);

public class ProcessCallbackCommandHandler(
    IUnitOfWork uow,
    IEnumerable<IPaymentProvider> providers)
    : IRequestHandler<ProcessCallbackCommand, Result<CallbackResult>>
{
    public async Task<Result<CallbackResult>> Handle(ProcessCallbackCommand cmd, CancellationToken ct)
    {
        var provider = providers.FirstOrDefault(p => p.Method == cmd.Method);
        if (provider is null)
            return Result<CallbackResult>.Failure("Unknown payment provider.");

        // Verify signature first — reject tampered callbacks early
        var verifyResult = await provider.VerifyCallbackAsync(cmd.Parameters, ct);
        if (!verifyResult.IsValid)
            return Result<CallbackResult>.Failure("Invalid callback signature.");

        // Look up payment by gateway order ID
        var payment = await uow.Payments.FirstOrDefaultAsync(
            p => p.GatewayOrderId == verifyResult.GatewayOrderId, ct);

        if (payment is null)
            return Result<CallbackResult>.NotFound("Payment not found for this order.");

        // Idempotency — skip if already processed
        if (payment.IsCallbackProcessed)
            return Result<CallbackResult>.Success(new CallbackResult(true, "Already processed.", payment.Id));

        // Log transaction
        var tx = new PaymentTransaction
        {
            PaymentId = payment.Id,
            Status = verifyResult.IsSuccess ? PaymentStatus.Success : PaymentStatus.Failed,
            GatewayTransactionId = verifyResult.GatewayTransactionId,
            RawRequest = JsonSerializer.Serialize(cmd.Parameters),
            Note = verifyResult.Message
        };
        await uow.PaymentTransactions.AddAsync(tx, ct);

        // Update payment
        payment.IsCallbackProcessed = true;
        payment.CallbackProcessedAt = DateTime.UtcNow;
        payment.GatewayTransactionId = verifyResult.GatewayTransactionId;
        payment.GatewayResponseCode = verifyResult.ResponseCode;
        payment.GatewayMessage = verifyResult.Message;

        var booking = await uow.Bookings.GetByIdAsync(payment.BookingId, ct);

        if (verifyResult.IsSuccess)
        {
            payment.Status = PaymentStatus.Success;
            payment.PaidAt = DateTime.UtcNow;

            if (booking is not null && booking.Status == BookingStatus.Pending)
            {
                booking.Status = BookingStatus.Confirmed;
                uow.Bookings.Update(booking);
            }
        }
        else
        {
            payment.Status = PaymentStatus.Failed;
            // Leave booking Pending so customer can retry
        }

        uow.Payments.Update(payment);
        await uow.SaveChangesAsync(ct);

        return Result<CallbackResult>.Success(new CallbackResult(verifyResult.IsSuccess, verifyResult.Message ?? string.Empty, payment.Id));
    }
}