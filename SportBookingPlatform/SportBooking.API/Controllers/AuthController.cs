using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Commands.Auth;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.DTOs.Auth;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IMediator mediator, IMapper mapper, ICurrentUser currentUser) : ControllerBase
{
    // =========================================================================
    // EMAIL + MẬT KHẨU
    // =========================================================================

    /// <summary>
    /// Đăng ký tài khoản mới bằng email + mật khẩu.
    /// Nếu email đã tồn tại qua Google, sẽ đặt password cho tài khoản đó.
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        var cmd = mapper.Map<RegisterCommand>(req);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    /// <summary>Đăng nhập bằng email + mật khẩu. Trả về JWT Access Token (8h) + Refresh Token (30d).</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var cmd = mapper.Map<LoginCommand>(req);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    // =========================================================================
    // GOOGLE OAUTH
    // =========================================================================

    /// <summary>
    /// Đăng nhập / đăng ký bằng Google.
    ///
    /// Flow:
    ///   1. Frontend tích hợp Google Sign-In SDK (Web: GSI / Mobile: google_sign_in)
    ///   2. Sau khi user chọn tài khoản Google, SDK trả về idToken
    ///   3. Frontend gửi idToken lên đây
    ///   4. Server verify với Google, tạo hoặc liên kết tài khoản, trả JWT của hệ thống
    ///
    /// Account linking rules:
    ///   - Email chưa tồn tại → tạo tài khoản mới (không có password)
    ///   - Email tồn tại nhưng chưa liên kết Google → tự động liên kết
    ///   - GoogleId đã tồn tại → đăng nhập bình thường
    /// </summary>
    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new GoogleLoginCommand(req.IdToken), ct);
        return result.ToActionResult(this);
    }

    // =========================================================================
    // TOKEN MANAGEMENT
    // =========================================================================

    /// <summary>
    /// Làm mới Access Token khi hết hạn.
    /// Gửi Access Token (đã hết hạn) trong header Authorization + Refresh Token trong body.
    /// </summary>
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest req, CancellationToken ct)
    {
        var authHeader = Request.Headers.Authorization.ToString();
        var accessToken = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader["Bearer ".Length..].Trim()
            : string.Empty;

        var result = await mediator.Send(new RefreshTokenCommand(accessToken, req.RefreshToken), ct);
        return result.ToActionResult(this);
    }

    /// <summary>
    /// Đăng xuất — revoke Refresh Token trên server.
    /// Access Token vẫn hợp lệ đến khi hết hạn (stateless JWT).
    /// Frontend phải tự xóa token khỏi storage.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new LogoutCommand(currentUser.UserId, req.RefreshToken), ct);
        return result.ToActionResult(this);
    }

    // =========================================================================
    // QUẢN LÝ TÀI KHOẢN [Authorize]
    // =========================================================================

    /// <summary>
    /// Đặt / đổi mật khẩu.
    ///   - Google-only user: đặt password lần đầu (không cần currentPassword)
    ///   - User đã có password: phải nhập currentPassword để đổi
    /// </summary>
    [HttpPost("set-password")]
    [Authorize]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(
            new SetPasswordCommand(currentUser.UserId, null, req.NewPassword), ct);
        return result.ToActionResult(this);
    }

    /// <summary>
    /// Đổi mật khẩu (yêu cầu mật khẩu cũ).
    /// Dùng endpoint này khi user đã có password và muốn đổi.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(
            new SetPasswordCommand(currentUser.UserId, req.CurrentPassword, req.NewPassword), ct);
        return result.ToActionResult(this);
    }
}

// DTO dùng riêng cho change-password (cần current password)
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);