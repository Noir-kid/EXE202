namespace SportSG.Domain.Entities;

public class CourtType
{
    public int CourtTypeId { get; set; }
    public string Name { get; set; } = null!;       // e.g. "Indoor", "Outdoor"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Court> Courts { get; set; } = [];
}

public class CourtImage
{
    public int CourtImageId { get; set; }
    public Guid CourtId { get; set; }
    public string Url { get; set; } = null!;
    public string? PublicId { get; set; }           // Cloudinary public ID
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Court Court { get; set; } = null!;
}

public class CourtFacility
{
    public int CourtFacilityId { get; set; }
    public Guid CourtId { get; set; }
    public string Name { get; set; } = null!;       // e.g. "Parking", "Locker Room"
    public string? Icon { get; set; }

    public Court Court { get; set; } = null!;
}
