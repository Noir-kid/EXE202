using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Court : AuditableEntity
{
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = default!;

    // Denormalized for faster tenant filtering
    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = default!;

    public string Name { get; set; } = default!;
    public SportType SportType { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public CourtStatus Status { get; set; } = CourtStatus.Available;

    // Price per hour (VND)
    public decimal PricePerHour { get; set; }

    // Peak hour surcharge multiplier (e.g. 1.5 = +50%)
    public decimal PeakHourMultiplier { get; set; } = 1.0m;
    public string? PeakHourStart { get; set; }  // "17:00"
    public string? PeakHourEnd { get; set; }    // "21:00"

    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
}