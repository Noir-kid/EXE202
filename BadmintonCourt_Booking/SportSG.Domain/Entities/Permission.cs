namespace SportSG.Domain.Entities;

public class Permission
{
    public int PermissionId { get; set; }
    public string Code { get; set; } = null!;       // e.g. "booking.create"
    public string Name { get; set; } = null!;
    public string Module { get; set; } = null!;     // e.g. "Booking"

    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}

public class RolePermission
{
    public int RoleId { get; set; }
    public int PermissionId { get; set; }

    public Role Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}
