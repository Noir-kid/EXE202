using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid BookingId { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Guid CourtId { get; set; }
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal BaseAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Note { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? CancelReason { get; set; }
    public Guid? CreatedBy { get; set; }       // null = customer self-book
    public Guid? ConfirmedBy { get; set; }
    public Guid? PromotionId { get; set; }

    public User Customer { get; set; } = null!;
    public Court Court { get; set; } = null!;
    public Promotion? Promotion { get; set; }
    public ICollection<Payment> Payments { get; set; } = [];
    public Review? Review { get; set; }
}
