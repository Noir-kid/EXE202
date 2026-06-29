using SportBooking.Domain.Common;

namespace SportBooking.Domain.Entities;

public class Review : AuditableEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    public Guid CourtId { get; set; }
    public Court Court { get; set; } = default!;

    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = default!;

    // 1–5 stars
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;
}