using SportSG.Application.DTOs.Booking;
using SportSG.Domain.Enums;

namespace SportSG.Application.Services;

public interface IBookingService
{
    /// <summary>Customer creates a booking.</summary>
    Task<BookingResponse> CreateAsync(Guid customerId, CreateBookingRequest req, CancellationToken ct = default);

    /// <summary>Get single booking (access checked inside).</summary>
    Task<BookingResponse> GetByIdAsync(Guid bookingId, Guid callerId, string callerRole, CancellationToken ct = default);

    /// <summary>Paged list — scope enforced by role.</summary>
    Task<PagedResult<BookingListItem>> ListAsync(
        BookingFilterRequest filter,
        Guid callerId,
        string callerRole,
        Guid? callerPartnerId,
        Guid? callerBranchId,
        CancellationToken ct = default);

    /// <summary>Confirm / check-in / cancel — enforced by role.</summary>
    Task UpdateStatusAsync(UpdateBookingStatusRequest req, Guid callerId, string callerRole, CancellationToken ct = default);

    /// <summary>Staff walk-in booking.</summary>
    Task<BookingResponse> CreateWalkInAsync(Guid staffId, CreateBookingRequest req, CancellationToken ct = default);

    /// <summary>Check court availability for a date.</summary>
    Task<IReadOnlyList<TimeOnly>> GetAvailableSlotsAsync(Guid courtId, DateOnly date, CancellationToken ct = default);
}
