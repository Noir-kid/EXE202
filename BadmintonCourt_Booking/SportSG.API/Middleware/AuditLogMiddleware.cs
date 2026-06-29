using System.Security.Claims;
using System.Text.Json;
using SportSG.Domain.Entities;
using SportSG.Infrastructure.Data;

namespace SportSG.API.Middleware;

public class AuditLogMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> _auditMethods = ["POST", "PUT", "PATCH", "DELETE"];

    public async Task InvokeAsync(HttpContext ctx)
    {
        await next(ctx);

        // Only audit mutating requests that succeeded
        if (!_auditMethods.Contains(ctx.Request.Method) || ctx.Response.StatusCode >= 500)
            return;

        var db = ctx.RequestServices.GetService<AppDbContext>();
        if (db is null) return;

        var userIdStr = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? ctx.User.FindFirstValue("sub");
        Guid.TryParse(userIdStr, out var userId);

        var log = new AuditLog
        {
            UserId     = userId == Guid.Empty ? null : userId,
            Action     = ctx.Request.Method,
            EntityName = ctx.Request.Path.Value ?? "",
            EntityId   = "",
            OldValues  = null,
            NewValues  = null,
            IpAddress  = ctx.Connection.RemoteIpAddress?.ToString(),
            UserAgent  = ctx.Request.Headers.UserAgent,
            CreatedAt  = DateTime.UtcNow,
        };

        db.AuditLogs.Add(log);
        try { await db.SaveChangesAsync(); }
        catch { /* non-critical — don't break response */ }
    }
}

public static class AuditLogMiddlewareExtensions
{
    public static IApplicationBuilder UseAuditLogging(this IApplicationBuilder app)
        => app.UseMiddleware<AuditLogMiddleware>();
}
