using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Partner : BaseEntity
{
    public Guid PartnerId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public string? LegalName { get; set; }
    public string? TaxCode { get; set; }
    public string ContactEmail { get; set; } = null!;
    public string? ContactPhone { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public decimal CommissionRate { get; set; } = 10m;
    public PartnerStatus Status { get; set; } = PartnerStatus.Pending;
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedBy { get; set; }

    public ICollection<Branch> Branches { get; set; } = [];
    public ICollection<PartnerUserRole> UserRoles { get; set; } = [];
    public ICollection<Promotion> Promotions { get; set; } = [];
    public ICollection<Membership> Memberships { get; set; } = [];
}
