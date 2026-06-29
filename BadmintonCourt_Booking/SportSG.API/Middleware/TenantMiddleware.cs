using System.Security.Claims;

namespace SportSG.API.Middleware;

/// <summary>
/// Reads tenant claims from JWT and puts them on HttpContext.Items
/// so controllers can access PartnerId / BranchId without decoding the token again.
/// </summary>
public class TenantMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            if (Guid.TryParse(ctx.User.FindFirstValue("partnerId"), out var pid))
                ctx.Items["PartnerId"] = pid;

            if (Guid.TryParse(ctx.User.FindFirstValue("branchId"), out var bid))
                ctx.Items["BranchId"] = bid;

            if (Guid.TryParse(ctx.User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid))
                ctx.Items["UserId"] = uid;

            ctx.Items["Role"] = ctx.User.FindFirstValue(ClaimTypes.Role) ?? "";
        }

        await next(ctx);
    }
}

public static class TenantMiddlewareExtensions
{
    public static IApplicationBuilder UseTenant(this IApplicationBuilder app)
        => app.UseMiddleware<TenantMiddleware>();
}
