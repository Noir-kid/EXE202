using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Branch : BaseEntity
{
    public Guid BranchId { get; set; } = Guid.NewGuid();
    public Guid PartnerId { get; set; }
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ImageUrl { get; set; }
    public string? MapUrl { get; set; }
    public TimeOnly? OpenTime { get; set; }
    public TimeOnly? CloseTime { get; set; }
    public BranchStatus Status { get; set; } = BranchStatus.Active;

    public Partner Partner { get; set; } = null!;
    public ICollection<Court> Courts { get; set; } = [];
    public ICollection<PartnerUserRole> UserRoles { get; set; } = [];
    public ICollection<BranchSportType> BranchSportTypes { get; set; } = [];
}
