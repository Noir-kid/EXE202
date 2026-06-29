using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Membership
{
    public Guid MembershipId { get; set; } = Guid.NewGuid();
    public Guid PartnerId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal LoyaltyMultiplier { get; set; } = 1m;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Partner Partner { get; set; } = null!;
    public ICollection<UserMembership> UserMemberships { get; set; } = [];
}

public class UserMembership
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public Guid MembershipId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public MembershipStatus Status { get; set; } = MembershipStatus.Active;
    public decimal PaidAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Membership Membership { get; set; } = null!;

    public bool IsValid() => Status == MembershipStatus.Active && DateOnly.FromDateTime(DateTime.UtcNow) <= EndDate;
}
