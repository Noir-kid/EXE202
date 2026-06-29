using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Booking;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Bookings;

public record CreateBookingCommand(
    Guid CourtId,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Note,
    string? PromotionCode
) : IRequest<Result<BookingResponse>>;

public class CreateBookingCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<CreateBookingCommand, Result<BookingResponse>>
{
    public async Task<Result<BookingResponse>> Handle(CreateBookingCommand cmd, CancellationToken ct)
    {
        if (cmd.StartTime >= cmd.EndTime)
            return Result<BookingResponse>.Failure("StartTime must be before EndTime.");

        if (cmd.BookingDate < DateOnly.FromDateTime(DateTime.UtcNow))
            return Result<BookingResponse>.Failure("Cannot book in the past.");

        var court = await uow.Courts.Query()
            .Include(c => c.Branch).ThenInclude(b => b.Owner)
            .FirstOrDefaultAsync(c => c.Id == cmd.CourtId && !c.IsDeleted, ct);

        if (court is null) return Result<BookingResponse>.NotFound("Court not found.");
        if (court.Status != CourtStatus.Available) return Result<BookingResponse>.Failure("Court is not available.");

        // Double-booking prevention with lock
        var result = await uow.ExecuteWithLockAsync(
            async () => await CreateBookingInLock(cmd, court, ct),
            lockKey: $"court:{cmd.CourtId}:{cmd.BookingDate}",
            timeout: TimeSpan.FromSeconds(10));

        return result ?? Result<BookingResponse>.Failure("Could not acquire booking lock. Try again.");
    }

    private async Task<Result<BookingResponse>> CreateBookingInLock(
        CreateBookingCommand cmd, Court court, CancellationToken ct)
    {
        // Check time slot availability
        var conflict = await uow.Bookings.ExistsAsync(b =>
            b.CourtId == cmd.CourtId &&
            b.BookingDate == cmd.BookingDate &&
            b.Status != BookingStatus.Cancelled &&
            b.Status != BookingStatus.Expired &&
            b.StartTime < cmd.EndTime &&
            b.EndTime > cmd.StartTime, ct);

        if (conflict) return Result<BookingResponse>.Failure("Time slot is already booked.");

        // Calculate price
        var hours = (cmd.EndTime.ToTimeSpan() - cmd.StartTime.ToTimeSpan()).TotalHours;
        var pricePerHour = IsPeakHour(cmd.StartTime, court)
            ? court.PricePerHour * court.PeakHourMultiplier
            : court.PricePerHour;
        var totalAmount = Math.Round((decimal)hours * pricePerHour, 0);

        // Apply promotion
        decimal discountAmount = 0;
        Promotion? promotion = null;
        if (!string.IsNullOrWhiteSpace(cmd.PromotionCode))
        {
            promotion = await uow.Promotions.FirstOrDefaultAsync(p =>
                p.Code == cmd.PromotionCode &&
                p.OwnerId == court.OwnerId &&
                p.IsActive &&
                !p.IsDeleted &&
                p.StartsAt <= DateTime.UtcNow &&
                p.ExpiresAt >= DateTime.UtcNow, ct);

            if (promotion is null)
                return Result<BookingResponse>.Failure("Promotion code is invalid or expired.");

            if (promotion.MinBookingAmount.HasValue && totalAmount < promotion.MinBookingAmount.Value)
                return Result<BookingResponse>.Failure($"Minimum booking amount for this promotion is {promotion.MinBookingAmount:N0} VND.");

            if (promotion.UsageLimit.HasValue && promotion.UsageCount >= promotion.UsageLimit.Value)
                return Result<BookingResponse>.Failure("Promotion usage limit reached.");

            discountAmount = promotion.Type == PromotionType.Percentage
                ? totalAmount * promotion.Value / 100
                : promotion.Value;

            if (promotion.MaxDiscount.HasValue)
                discountAmount = Math.Min(discountAmount, promotion.MaxDiscount.Value);

            discountAmount = Math.Min(discountAmount, totalAmount);
            promotion.UsageCount++;
            uow.Promotions.Update(promotion);
        }

        var booking = new Booking
        {
            OwnerId = court.OwnerId,
            BranchId = court.BranchId,
            CourtId = court.Id,
            CustomerId = currentUser.UserId,
            BookingDate = cmd.BookingDate,
            StartTime = cmd.StartTime,
            EndTime = cmd.EndTime,
            TotalAmount = totalAmount,
            DiscountAmount = discountAmount,
            FinalAmount = totalAmount - discountAmount,
            Status = BookingStatus.Pending,
            Note = cmd.Note,
            PromotionId = promotion?.Id,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };

        await uow.Bookings.AddAsync(booking, ct);
        await uow.SaveChangesAsync(ct);

        return Result<BookingResponse>.Success(MapToResponse(booking, court), 201);
    }

    private static bool IsPeakHour(TimeOnly time, Court court)
    {
        if (court.PeakHourStart is null || court.PeakHourEnd is null) return false;
        var peak = TimeOnly.Parse(court.PeakHourStart);
        var peakEnd = TimeOnly.Parse(court.PeakHourEnd);
        return time >= peak && time < peakEnd;
    }

    private static BookingResponse MapToResponse(Booking b, Court court) =>
        new(b.Id, b.CourtId, court.Name, court.Branch.Name, court.Branch.Owner.Name,
            b.CustomerId, string.Empty, b.BookingDate, b.StartTime, b.EndTime,
            b.TotalAmount, b.DiscountAmount, b.FinalAmount, b.Status, b.Note,
            b.CreatedAt, null);
}