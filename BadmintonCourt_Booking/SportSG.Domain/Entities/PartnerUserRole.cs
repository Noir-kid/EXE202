namespace SportSG.Domain.Entities;

/// <summary>
/// RBAC + Multi-Tenant: maps a User to a Partner with a Role,
/// optionally scoped to a specific Branch.
/// </summary>
public class PartnerUserRole
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PartnerId { get; set; }
    public Guid? BranchId { get; set; }   // null = partner-wide
    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Partner Partner { get; set; } = null!;
    public Branch? Branch { get; set; }
    public Role Role { get; set; } = null!;
}
