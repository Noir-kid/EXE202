namespace SportSG.API.Extensions;

/// <summary>
/// Helpers to read tenant context from HttpContext.Items (populated by TenantMiddleware).
/// Use these in every controller instead of reading JWT claims directly.
/// </summary>
public static class ClaimsExtensions
{
    public static Guid GetUserId(this HttpContext ctx)
        => ctx.Items.TryGetValue("UserId", out var v) && v is Guid id ? id : Guid.Empty;

    public static string GetRole(this HttpContext ctx)
        => ctx.Items.TryGetValue("Role", out var v) && v is string r ? r : string.Empty;

    public static Guid? GetPartnerId(this HttpContext ctx)
        => ctx.Items.TryGetValue("PartnerId", out var v) && v is Guid id ? id : null;

    public static Guid? GetBranchId(this HttpContext ctx)
        => ctx.Items.TryGetValue("BranchId", out var v) && v is Guid id ? id : null;
}
