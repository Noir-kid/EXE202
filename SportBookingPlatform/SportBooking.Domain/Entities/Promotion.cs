using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Promotion : AuditableEntity
{
    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = default!;

    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public PromotionType Type { get; set; }
    public decimal Value { get; set; }   // % or fixed VND amount
    public decimal? MaxDiscount { get; set; }   // Cap for percentage discounts
    public decimal? MinBookingAmount { get; set; }

    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; } = 0;

    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Booking> Bookings { get; set; } = [];
}