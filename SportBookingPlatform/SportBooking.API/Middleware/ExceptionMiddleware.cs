using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace SportBooking.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ValidationException ex)
        {
            await WriteErrorAsync(ctx, HttpStatusCode.BadRequest,
                ex.Errors.Select(e => e.ErrorMessage).ToArray());
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteErrorAsync(ctx, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await WriteErrorAsync(ctx, HttpStatusCode.InternalServerError, "An unexpected error occurred.");
        }
    }

    private static async Task WriteErrorAsync(HttpContext ctx, HttpStatusCode status, params string[] errors)
    {
        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode = (int)status;
        var body = JsonSerializer.Serialize(new { errors });
        await ctx.Response.WriteAsync(body);
    }
}