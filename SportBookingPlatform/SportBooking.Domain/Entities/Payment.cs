using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Payment : AuditableEntity
{
    public Guid BookingId { get; set; }
    public Booking Booking { get; set; } = default!;

    // Tenant denormalized
    public Guid OwnerId { get; set; }

    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    // Gateway-specific fields
    public string? GatewayTransactionId { get; set; }
    public string? GatewayOrderId { get; set; }       // Our internal order ID sent to gateway
    public string? GatewayResponseCode { get; set; }
    public string? GatewayMessage { get; set; }
    public DateTime? PaidAt { get; set; }

    // Idempotency: once a callback is processed, this is set to prevent re-processing
    public bool IsCallbackProcessed { get; set; } = false;
    public DateTime? CallbackProcessedAt { get; set; }

    public ICollection<PaymentTransaction> Transactions { get; set; } = [];
}