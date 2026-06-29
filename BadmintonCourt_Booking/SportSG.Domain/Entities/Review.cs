namespace SportSG.Domain.Entities;

public class Review
{
    public Guid ReviewId { get; set; } = Guid.NewGuid();
    public Guid BookingId { get; set; }
    public Guid UserId { get; set; }
    public Guid CourtId { get; set; }
    public byte Rating { get; set; }          // 1–5
    public string? Comment { get; set; }
    public string? ImageUrls { get; set; }
    public bool IsVisible { get; set; } = true;
    public string? ReplyContent { get; set; }
    public DateTime? RepliedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
    public Court Court { get; set; } = null!;
}
