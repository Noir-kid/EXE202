namespace SportSG.Domain.Entities;

public class Favorite
{
    public int FavoriteId { get; set; }
    public Guid UserId { get; set; }
    public Guid CourtId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Court Court { get; set; } = null!;
}
