using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Application.DTOs.Auth;
using SportSG.Application.Services;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IAuthService authService,
    IConfiguration cfg,
    IWebHostEnvironment env) : ControllerBase
{
    // ── Email / Password ─────────────────────────────────────────────────

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

    // ── Google OAuth: Luồng 1 — Frontend gửi id_token ───────────────────

    /// <summary>
    /// Dùng khi frontend đã lấy được id_token từ Google Identity Services / One Tap.
    /// Frontend gửi: POST /api/auth/google  { "idToken": "eyJ..." }
    /// Backend validate và trả về JWT hệ thống.
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req, CancellationToken ct)
    {
        var result = await authService.GoogleLoginAsync(req, ct);
        return Ok(result);
    }

    // ── Google OAuth: Luồng 2 — Server-side ─────────────────────────────

    /// <summary>
    /// Bước 1: Redirect người dùng đến trang đăng nhập Google.
    /// Mở URL này trực tiếp trên browser: GET /api/auth/google/redirect
    /// </summary>
    [HttpGet("google/redirect")]
    [AllowAnonymous]
    public IActionResult GoogleRedirect()
    {
        var clientId    = cfg["Google:ClientId"]    ?? throw new InvalidOperationException("Google:ClientId chưa cấu hình.");
        var redirectUri = cfg["Google:RedirectUri"] ?? throw new InvalidOperationException("Google:RedirectUri chưa cấu hình.");

        var state = Guid.NewGuid().ToString("N");

        var googleUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
            $"?client_id={Uri.EscapeDataString(clientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&response_type=code" +
            $"&scope={Uri.EscapeDataString("openid email profile")}" +
            $"&access_type=offline" +
            $"&prompt=select_account" +
            $"&state={state}";

        return Redirect(googleUrl);
    }

    /// <summary>
    /// Bước 2: Google redirect về đây sau khi user đăng nhập.
    /// URI này PHẢI khớp với redirect_uris đã đăng ký trong Google Console.
    /// Hiện tại: https://localhost:62116/api/auth/google
    /// Dev: trả JSON trực tiếp. Production: redirect về frontend.
    /// </summary>
    [HttpGet("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleCallback(
        [FromQuery] string? code,
        [FromQuery] string? error,
        CancellationToken ct)
    {
        var redirectUri = cfg["Google:RedirectUri"]
            ?? throw new InvalidOperationException("Google:RedirectUri chưa cấu hình.");

        if (!string.IsNullOrEmpty(error) || string.IsNullOrEmpty(code))
            return BadRequest(new { error = error ?? "Google login bị hủy hoặc không có code." });

        var result = await authService.GoogleCallbackAsync(code, redirectUri, ct);

        // Dev: trả JSON để test dễ hơn mà không cần chạy frontend
        if (env.IsDevelopment())
            return Ok(result);

        // Production: redirect về frontend với token trong query string
        var frontendUrl = cfg["Google:FrontendUrl"] ?? "http://localhost:3000";
        return Redirect($"{frontendUrl}/auth/callback" +
            $"?accessToken={Uri.EscapeDataString(result.AccessToken)}" +
            $"&refreshToken={Uri.EscapeDataString(result.RefreshToken)}");
    }

    // ── Token management ─────────────────────────────────────────────────

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

    // ── Password management ──────────────────────────────────────────────

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
