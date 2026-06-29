using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

// Immutable log of every payment attempt/callback — never deleted
public class PaymentTransaction : BaseEntity
{
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = default!;

    public PaymentStatus Status { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? RawRequest { get; set; }   // JSON snapshot of callback params
    public string? RawResponse { get; set; }  // JSON snapshot of our response
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}