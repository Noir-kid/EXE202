using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Banner
{
    public int BannerId { get; set; }
    public string Title { get; set; } = null!;
    public string? Subtitle { get; set; }
    public string ImageUrl { get; set; } = null!;
    public string? LinkUrl { get; set; }
    public BannerPosition Position { get; set; } = BannerPosition.Home;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
