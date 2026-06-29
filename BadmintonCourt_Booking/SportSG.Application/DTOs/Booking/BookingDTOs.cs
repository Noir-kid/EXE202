using SportSG.Domain.Enums;

namespace SportSG.Application.DTOs.Booking;

public record CreateBookingRequest(
    Guid CourtId,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Note,
    string? PromoCode
);

public record BookingResponse(
    Guid BookingId,
    Guid CourtId,
    string CourtName,
    string BranchName,
    string PartnerName,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    int DurationMinutes,
    decimal BaseAmount,
    decimal DiscountAmount,
    decimal TotalAmount,
    string Status,
    string? Note,
    string? CancelReason,
    DateTime CreatedAt
);

public record BookingListItem(
    Guid BookingId,
    string CourtName,
    string BranchName,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt
);

public record UpdateBookingStatusRequest(
    Guid BookingId,
    BookingStatus NewStatus,
    string? Reason
);

public record BookingFilterRequest(
    Guid? PartnerId,
    Guid? BranchId,
    Guid? CourtId,
    string? Status,
    DateOnly? From,
    DateOnly? To,
    int Page = 1,
    int PageSize = 20
);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
