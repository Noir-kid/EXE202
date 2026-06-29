using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Court : BaseEntity
{
    public Guid CourtId { get; set; } = Guid.NewGuid();
    public Guid BranchId { get; set; }
    public int SportTypeId { get; set; }
    public int? CourtTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int? Capacity { get; set; }
    public decimal BasePrice { get; set; }
    public CourtStatus Status { get; set; } = CourtStatus.Active;

    public Branch Branch { get; set; } = null!;
    public SportType SportType { get; set; } = null!;
    public CourtType? CourtType { get; set; }
    public ICollection<CourtPricingRule> PricingRules { get; set; } = [];
    public ICollection<CourtImage> Images { get; set; } = [];
    public ICollection<CourtFacility> Facilities { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<MaintenanceSchedule> MaintenanceSchedules { get; set; } = [];
    public ICollection<Favorite> Favorites { get; set; } = [];

    public decimal GetPriceForSlot(DayOfWeek day, TimeOnly time)
    {
        var rule = PricingRules
            .Where(r => r.IsActive
                && (r.DayOfWeek == null || (int)r.DayOfWeek == (int)day)
                && r.StartTime <= time && time < r.EndTime)
            .OrderByDescending(r => r.DayOfWeek.HasValue) // specific day wins
            .FirstOrDefault();
        return rule?.Price ?? BasePrice;
    }
}

public class CourtPricingRule
{
    public int RuleId { get; set; }
    public Guid CourtId { get; set; }
    public int? DayOfWeek { get; set; }    // null = all days
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal Price { get; set; }
    public string? Label { get; set; }
    public bool IsActive { get; set; } = true;

    public Court Court { get; set; } = null!;
}
