using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public NotificationType Type { get; set; }
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;

    // Optional deep-link payload (e.g. bookingId)
    public string? Payload { get; set; }

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}