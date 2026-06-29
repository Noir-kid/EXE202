using SportBooking.Domain.Enums;

namespace SportBooking.Application.DTOs.Booking;

public record CreateBookingRequest(
    Guid CourtId,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Note = null,
    string? PromotionCode = null
);

public record BookingResponse(
    Guid BookingId,
    Guid CourtId,
    string CourtName,
    string BranchName,
    string OwnerName,
    Guid CustomerId,
    string CustomerName,
    DateOnly BookingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal TotalAmount,
    decimal DiscountAmount,
    decimal FinalAmount,
    BookingStatus Status,
    string? Note,
    DateTime CreatedAt,
    PaymentInfo? Payment
);

public record PaymentInfo(
    Guid PaymentId,
    PaymentMethod Method,
    PaymentStatus Status,
    DateTime? PaidAt
);

public record CancelBookingRequest(string? Reason = null);

public record CheckAvailabilityRequest(
    Guid CourtId,
    DateOnly Date
);

public record TimeSlot(
    TimeOnly Start,
    TimeOnly End,
    bool IsAvailable,
    decimal Price
);

public record AvailabilityResponse(
    Guid CourtId,
    string CourtName,
    DateOnly Date,
    List<TimeSlot> Slots
);