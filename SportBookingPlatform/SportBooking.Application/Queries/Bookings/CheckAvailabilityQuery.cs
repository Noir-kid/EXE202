using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Booking;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Queries.Bookings;

public record CheckAvailabilityQuery(Guid CourtId, DateOnly Date)
    : IRequest<Result<AvailabilityResponse>>;

public class CheckAvailabilityQueryHandler(IUnitOfWork uow)
    : IRequestHandler<CheckAvailabilityQuery, Result<AvailabilityResponse>>
{
    public async Task<Result<AvailabilityResponse>> Handle(CheckAvailabilityQuery query, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch)
            .FirstOrDefaultAsync(c => c.Id == query.CourtId && !c.IsDeleted, ct);

        if (court is null) return Result<AvailabilityResponse>.NotFound("Court not found.");

        // Load all bookings for this court on this date
        var bookedSlots = await uow.Bookings.FindAsync(b =>
            b.CourtId == query.CourtId &&
            b.BookingDate == query.Date &&
            b.Status != BookingStatus.Cancelled &&
            b.Status != BookingStatus.Expired, ct);

        // Generate 1-hour slots from open to close
        var openTime = TimeOnly.Parse(court.Branch.OpenTime);
        var closeTime = TimeOnly.Parse(court.Branch.CloseTime);
        var slots = new List<TimeSlot>();

        for (var t = openTime; t.Add(TimeSpan.FromHours(1)) <= closeTime; t = t.Add(TimeSpan.FromHours(1)))
        {
            var slotEnd = t.Add(TimeSpan.FromHours(1));
            var isAvailable = !bookedSlots.Any(b => b.StartTime < slotEnd && b.EndTime > t);

            var isPeak = court.PeakHourStart is not null && court.PeakHourEnd is not null &&
                         t >= TimeOnly.Parse(court.PeakHourStart) && t < TimeOnly.Parse(court.PeakHourEnd);

            var price = isPeak
                ? Math.Round(court.PricePerHour * court.PeakHourMultiplier, 0)
                : court.PricePerHour;

            slots.Add(new TimeSlot(t, slotEnd, isAvailable, price));
        }

        return Result<AvailabilityResponse>.Success(
            new AvailabilityResponse(court.Id, court.Name, query.Date, slots));
    }
}