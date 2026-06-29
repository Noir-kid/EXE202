namespace SportSG.Domain.Entities;

public class AuditLog
{
    public long AuditLogId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = null!;         // CREATE, UPDATE, DELETE
    public string EntityName { get; set; } = null!;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }              // JSON
    public string? NewValues { get; set; }              // JSON
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
