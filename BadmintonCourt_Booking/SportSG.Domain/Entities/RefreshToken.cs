namespace SportSG.Domain.Entities;

/// <summary>Dedicated table for refresh tokens — supports rotation and revocation.</summary>
public class RefreshToken
{
    public long Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public string? ReplacedByToken { get; set; }        // after rotation
    public string? RevokedByIp { get; set; }
    public string? CreatedByIp { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAt { get; set; }

    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;

    public User User { get; set; } = null!;
}
