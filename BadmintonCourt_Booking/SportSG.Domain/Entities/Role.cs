namespace SportSG.Domain.Entities;

public class Role
{
    public int RoleId { get; set; }
    public string Code { get; set; } = null!;   // SuperAdmin|PartnerAdmin|BranchManager|Staff|Customer
    public string Name { get; set; } = null!;

    public ICollection<PartnerUserRole> PartnerUserRoles { get; set; } = [];
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
