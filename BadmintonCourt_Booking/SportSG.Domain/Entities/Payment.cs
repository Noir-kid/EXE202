using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Payment
{
    public Guid PaymentId { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionRef { get; set; }
    public string? GatewayResponse { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? RefundReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
    public CommissionLedger? Commission { get; set; }
}

public class CommissionLedger
{
    public int Id { get; set; }
    public Guid PaymentId { get; set; }
    public Guid PartnerId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmt { get; set; }
    public decimal NetAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Payment Payment { get; set; } = null!;
    public Partner Partner { get; set; } = null!;
}
