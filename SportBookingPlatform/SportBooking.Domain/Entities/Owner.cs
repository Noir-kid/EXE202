using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class Owner : AuditableEntity
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? TaxCode { get; set; }
    public string? Logo { get; set; }
    public OwnerStatus Status { get; set; } = OwnerStatus.Active;

    // Commission rate (%) the platform takes from each booking
    public decimal CommissionRate { get; set; } = 10m;

    public ICollection<Branch> Branches { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Promotion> Promotions { get; set; } = [];
}