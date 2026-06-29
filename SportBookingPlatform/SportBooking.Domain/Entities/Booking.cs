using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Booking : AuditableEntity
{
    // Tenant identifiers — denormalized for fast multi-tenant queries
    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = default!;

    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;

    public Guid CourtId { get; set; }
    public Court Court { get; set; } = default!;

    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = default!;

    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal FinalAmount { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? Note { get; set; }

    // Link to promotion if used
    public Guid? PromotionId { get; set; }
    public Promotion? Promotion { get; set; }

    // Expiry for pending bookings (background job marks as Expired)
    public DateTime? ExpiresAt { get; set; }

    public Payment? Payment { get; set; }
    public Review? Review { get; set; }
}