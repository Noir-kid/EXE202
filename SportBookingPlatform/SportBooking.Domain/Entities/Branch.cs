using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Branch : AuditableEntity
{
    public Guid OwnerId { get; set; }
    public Owner Owner { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string Address { get; set; } = default!;
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Phone { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }

    // Operating hours stored as "HH:mm"
    public string OpenTime { get; set; } = "06:00";
    public string CloseTime { get; set; } = "22:00";

    public BranchStatus Status { get; set; } = BranchStatus.Active;

    public ICollection<Court> Courts { get; set; } = [];
    public ICollection<User> Staff { get; set; } = [];
}