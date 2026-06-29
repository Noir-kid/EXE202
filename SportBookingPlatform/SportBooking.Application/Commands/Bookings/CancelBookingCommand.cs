using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Bookings;

public record CancelBookingCommand(Guid BookingId, string? Reason) : IRequest<Result>;

public class CancelBookingCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<CancelBookingCommand, Result>
{
    public async Task<Result> Handle(CancelBookingCommand cmd, CancellationToken ct)
    {
        var booking = await uow.Bookings.GetByIdAsync(cmd.BookingId, ct);
        if (booking is null) return Result.NotFound("Booking not found.");

        // Customer can only cancel own bookings; Admin/Owner/Staff can cancel any
        if (currentUser.IsCustomer && booking.CustomerId != currentUser.UserId)
            return Result.Failure("Access denied.", 403);

        if (currentUser.IsOwner && booking.OwnerId != currentUser.OwnerId)
            return Result.Failure("Access denied.", 403);

        if (currentUser.IsStaff && booking.BranchId != currentUser.BranchId)
            return Result.Failure("Access denied.", 403);

        if (booking.Status is BookingStatus.Completed or BookingStatus.Expired)
            return Result.Failure($"Cannot cancel a booking with status '{booking.Status}'.");

        if (booking.Status == BookingStatus.Cancelled)
            return Result.Failure("Booking is already cancelled.");

        booking.Status = BookingStatus.Cancelled;
        booking.Note = string.IsNullOrWhiteSpace(cmd.Reason)
            ? booking.Note
            : $"{booking.Note} | Cancelled: {cmd.Reason}";
        booking.UpdatedAt = DateTime.UtcNow;
        booking.UpdatedBy = currentUser.UserId.ToString();

        uow.Bookings.Update(booking);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}