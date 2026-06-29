using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Application.DTOs.Auth;
using SportSG.Application.Services;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var result = await authService.RegisterAsync(req, ct);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var result = await authService.LoginAsync(req, ct);
        return Ok(result);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req, CancellationToken ct)
    {
        var result = await authService.GoogleLoginAsync(req, ct);
        return Ok(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest req, CancellationToken ct)
    {
        var result = await authService.RefreshAsync(req, ct);
        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await authService.LogoutAsync(HttpContext.GetUserId(), ct);
        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        await authService.ChangePasswordAsync(HttpContext.GetUserId(), req, ct);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req, CancellationToken ct)
    {
        await authService.ForgotPasswordAsync(req, ct);
        return NoContent();
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req, CancellationToken ct)
    {
        await authService.ResetPasswordAsync(req, ct);
        return NoContent();
    }
}
