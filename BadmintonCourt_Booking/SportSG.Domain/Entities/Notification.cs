using SportSG.Domain.Enums;

namespace SportSG.Domain.Entities;

public class Notification
{
    public long NotificationId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public string? RefType { get; set; }
    public Guid? RefId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class LoyaltyTransaction
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public int Points { get; set; }       // positive = earn, negative = spend
    public string Type { get; set; } = null!;
    public string? RefType { get; set; }
    public Guid? RefId { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public class MaintenanceSchedule
{
    public Guid MaintenanceId { get; set; } = Guid.NewGuid();
    public Guid CourtId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Reason { get; set; } = null!;
    public string Status { get; set; } = "Scheduled";
    public Guid? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Court Court { get; set; } = null!;
}
