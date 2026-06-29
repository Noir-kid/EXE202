using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Promotion
{
    public Guid PromotionId { get; set; } = Guid.NewGuid();
    public Guid? PartnerId { get; set; }      // null = platform-wide
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal MinOrderAmount { get; set; }
    public decimal? MaxDiscount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Partner? Partner { get; set; }
    public ICollection<Booking> Bookings { get; set; } = [];

    public bool IsValid(decimal orderAmount, DateTime at) =>
        IsActive
        && at >= ValidFrom && at <= ValidTo
        && orderAmount >= MinOrderAmount
        && (UsageLimit == null || UsageCount < UsageLimit);

    public decimal Calculate(decimal amount)
    {
        var disc = DiscountType == DiscountType.Percent
            ? amount * DiscountValue / 100m
            : DiscountValue;
        if (MaxDiscount.HasValue) disc = Math.Min(disc, MaxDiscount.Value);
        return Math.Min(disc, amount);
    }
}
