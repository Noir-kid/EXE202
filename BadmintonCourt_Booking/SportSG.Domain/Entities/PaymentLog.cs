using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

/// <summary>Immutable log for every payment gateway interaction.</summary>
public class PaymentLog
{
    public long PaymentLogId { get; set; }
    public Guid? PaymentId { get; set; }
    public PaymentGateway Gateway { get; set; }         // VNPay, MoMo, PayOS
    public string Direction { get; set; } = null!;      // REQUEST, CALLBACK, WEBHOOK
    public string? RawRequest { get; set; }             // JSON
    public string? RawResponse { get; set; }            // JSON
    public string? TransactionRef { get; set; }
    public bool? Success { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Payment? Payment { get; set; }
}

public class Coupon
{
    public int CouponId { get; set; }
    public Guid? PartnerId { get; set; }
    public string Code { get; set; } = null!;
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
}
