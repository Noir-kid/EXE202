using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Payment;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Payments;

public record CreatePaymentCommand(
    Guid BookingId,
    PaymentMethod Method,
    string ReturnUrl,
    string ClientIp
) : IRequest<Result<CreatePaymentResponse>>;

public class CreatePaymentCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IEnumerable<IPaymentProvider> providers)
    : IRequestHandler<CreatePaymentCommand, Result<CreatePaymentResponse>>
{
    public async Task<Result<CreatePaymentResponse>> Handle(CreatePaymentCommand cmd, CancellationToken ct)
    {
        var booking = await uow.Bookings.GetByIdAsync(cmd.BookingId, ct);
        if (booking is null) return Result<CreatePaymentResponse>.NotFound("Booking not found.");

        if (currentUser.IsCustomer && booking.CustomerId != currentUser.UserId)
            return Result<CreatePaymentResponse>.Forbidden();

        if (booking.Status != BookingStatus.Pending)
            return Result<CreatePaymentResponse>.Failure($"Payment not allowed for booking status '{booking.Status}'.");

        var existingPayment = await uow.Payments.FirstOrDefaultAsync(
            p => p.BookingId == cmd.BookingId && p.Status == PaymentStatus.Pending, ct);
        if (existingPayment is not null)
            return Result<CreatePaymentResponse>.Failure("A pending payment already exists for this booking.");

        var gatewayOrderId = $"SB-{booking.Id:N}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

        var payment = new Payment
        {
            BookingId = cmd.BookingId,
            OwnerId = booking.OwnerId,
            Amount = booking.FinalAmount,
            Method = cmd.Method,
            Status = PaymentStatus.Pending,
            GatewayOrderId = gatewayOrderId
        };

        await uow.Payments.AddAsync(payment, ct);
        await uow.SaveChangesAsync(ct);

        var provider = providers.FirstOrDefault(p => p.Method == cmd.Method)
            ?? throw new InvalidOperationException($"No payment provider for method '{cmd.Method}'.");

        var providerRequest = new ProviderCreateRequest(
            payment.Id, booking.Id, payment.Amount,
            $"Thanh toan dat san #{booking.Id}",
            cmd.ReturnUrl,
            $"{cmd.ReturnUrl}/ipn",
            cmd.ClientIp,
            gatewayOrderId);

        var providerResult = await provider.CreateAsync(providerRequest, ct);

        if (!providerResult.Success)
        {
            payment.Status = PaymentStatus.Failed;
            payment.GatewayMessage = providerResult.Error;
            uow.Payments.Update(payment);
            await uow.SaveChangesAsync(ct);
            return Result<CreatePaymentResponse>.Failure(providerResult.Error ?? "Payment initiation failed.");
        }

        if (cmd.Method == PaymentMethod.Cash)
        {
            payment.Status = PaymentStatus.Success;
            payment.PaidAt = DateTime.UtcNow;
            payment.IsCallbackProcessed = true;
            booking.Status = BookingStatus.Confirmed;
            uow.Payments.Update(payment);
            uow.Bookings.Update(booking);
            await uow.SaveChangesAsync(ct);
        }

        return Result<CreatePaymentResponse>.Success(new CreatePaymentResponse(
            payment.Id, providerResult.PaymentUrl, cmd.Method, payment.Amount, payment.Status), 201);
    }
}