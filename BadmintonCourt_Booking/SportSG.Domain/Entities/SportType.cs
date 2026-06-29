namespace SportSG.Domain.Entities;

public class SportType
{
    public int SportTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Court> Courts { get; set; } = [];
    public ICollection<BranchSportType> BranchSportTypes { get; set; } = [];
}

public class BranchSportType
{
    public Guid BranchId { get; set; }
    public int SportTypeId { get; set; }
    public Branch Branch { get; set; } = null!;
    public SportType SportType { get; set; } = null!;
}
