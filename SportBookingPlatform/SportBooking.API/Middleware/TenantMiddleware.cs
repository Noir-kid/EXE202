using Microsoft.AspNetCore.Http;

namespace SportBooking.API.Middleware;

/// <summary>
/// Validates that Owner/Staff tokens include the required tenant claims.
/// Tenant isolation logic itself lives in query/command handlers via ICurrentUser.
/// This middleware simply rejects requests where tenant claims are missing when expected.
/// </summary>
public class TenantMiddleware(RequestDelegate next)
{
    // Paths that do not require tenant validation
    private static readonly HashSet<string> _excludedPaths =
    [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/swagger"
    ];

    public async Task InvokeAsync(HttpContext ctx)
    {
        // Skip tenant check for excluded paths and anonymous requests
        var path = ctx.Request.Path.Value?.ToLower() ?? string.Empty;
        var isExcluded = _excludedPaths.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!isExcluded && ctx.User.Identity?.IsAuthenticated == true)
        {
            var role = ctx.User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

            // Owner/Staff must have ownerId claim in their token
            if (role is "Owner" or "Staff")
            {
                var hasOwnerId = ctx.User.HasClaim(c => c.Type == "ownerId");
                if (!hasOwnerId)
                {
                    ctx.Response.StatusCode = 403;
                    await ctx.Response.WriteAsync("{\"errors\":[\"Tenant claim missing from token.\"]}");
                    return;
                }
            }
        }

        await next(ctx);
    }
}