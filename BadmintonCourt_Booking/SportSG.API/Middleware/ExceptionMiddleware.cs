using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace SportSG.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
            await HandleAsync(ctx, ex);
        }
    }

    private static async Task HandleAsync(HttpContext ctx, Exception ex)
    {
        var (status, title, detail) = ex switch
        {
            ValidationException ve => (
                HttpStatusCode.BadRequest,
                "Validation failed",
                string.Join("; ", ve.Errors.Select(e => e.ErrorMessage))),

            NotFoundException nfe => (HttpStatusCode.NotFound,      "Not found",      nfe.Message),
            ForbiddenException fe => (HttpStatusCode.Forbidden,     "Forbidden",      fe.Message),
            BusinessException  be => (HttpStatusCode.UnprocessableEntity, "Business rule violation", be.Message),
            ConflictException  ce => (HttpStatusCode.Conflict,      "Conflict",       ce.Message),
            UnauthorizedAccessException uae => (HttpStatusCode.Unauthorized, "Unauthorized", uae.Message),

            _ => (HttpStatusCode.InternalServerError, "Internal server error", "An unexpected error occurred.")
        };

        var problem = new ProblemDetails
        {
            Status = (int)status,
            Title  = title,
            Detail = detail,
            Instance = ctx.Request.Path,
        };

        ctx.Response.ContentType = "application/problem+json";
        ctx.Response.StatusCode  = (int)status;

        await ctx.Response.WriteAsync(JsonSerializer.Serialize(problem,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

// ── Custom exceptions ─────────────────────────────────────────────────────────
public class NotFoundException(string message) : Exception(message);
public class ForbiddenException(string message) : Exception(message);
public class BusinessException(string message) : Exception(message);
public class ConflictException(string message) : Exception(message);

public static class ExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseExceptionHandling(this IApplicationBuilder app)
        => app.UseMiddleware<ExceptionMiddleware>();
}
