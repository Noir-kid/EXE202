using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Auth;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Auth;

public record GoogleLoginCommand(string IdToken) : IRequest<Result<AuthResponse>>;

public class GoogleLoginCommandHandler(
    IUnitOfWork uow,
    ITokenService tokenService,
    IGoogleAuthService googleAuthService)
    : IRequestHandler<GoogleLoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(GoogleLoginCommand cmd, CancellationToken ct)
    {
        // ── 1. Verify Google ID token ────────────────────────────────────────
        var googleUser = await googleAuthService.VerifyIdTokenAsync(cmd.IdToken, ct);
        if (googleUser is null)
            return Result<AuthResponse>.Unauthorized("Google token không hợp lệ hoặc đã hết hạn.");

        // ── 2. Tìm user theo GoogleId, sau đó theo email ─────────────────────
        var user = await uow.Users.FirstOrDefaultAsync(
            u => u.GoogleId == googleUser.GoogleId && !u.IsDeleted, ct);

        if (user is null)
        {
            // Tìm theo email — có thể user đã đăng ký bằng email+mk trước đó
            user = await uow.Users.FirstOrDefaultAsync(
                u => u.Email == googleUser.Email.ToLower() && !u.IsDeleted, ct);

            if (user is not null)
            {
                // Account tồn tại với email này — liên kết Google vào
                if (!user.IsActive)
                    return Result<AuthResponse>.Unauthorized("Tài khoản đã bị vô hiệu hóa.");

                user.GoogleId = googleUser.GoogleId;
                user.IsEmailVerified = true;
                // Cập nhật avatar nếu chưa có
                if (string.IsNullOrEmpty(user.Avatar) && googleUser.Picture is not null)
                    user.Avatar = googleUser.Picture;
                user.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Tạo tài khoản mới từ Google — không có password
                user = new User
                {
                    Email = googleUser.Email.ToLower(),
                    PasswordHash = null,    // Google-only, chưa có mk
                    FullName = googleUser.FullName,
                    Avatar = googleUser.Picture,
                    GoogleId = googleUser.GoogleId,
                    IsEmailVerified = true,
                    Role = UserRole.Customer,
                    IsActive = true
                };
                await uow.Users.AddAsync(user, ct);
            }
        }
        else
        {
            if (!user.IsActive)
                return Result<AuthResponse>.Unauthorized("Tài khoản đã bị vô hiệu hóa.");

            // Cập nhật thông tin nếu Google thay đổi
            user.IsEmailVerified = true;
            if (string.IsNullOrEmpty(user.Avatar) && googleUser.Picture is not null)
                user.Avatar = googleUser.Picture;
            user.UpdatedAt = DateTime.UtcNow;
        }

        // ── 3. Cấp Refresh Token mới ─────────────────────────────────────────
        var refreshToken = tokenService.GenerateRefreshToken();
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        // ── 4. Trả JWT ───────────────────────────────────────────────────────
        var accessToken = tokenService.GenerateAccessToken(user);
        return Result<AuthResponse>.Success(new AuthResponse(
            accessToken, refreshToken, 28800, MapToUserDto(user)));
    }

    private static UserDto MapToUserDto(User user) =>
        new(user.Id, user.Email, user.FullName, user.Phone, user.Avatar,
            user.Role, user.OwnerId, user.IsEmailVerified,
            HasPassword: user.PasswordHash is not null,
            HasGoogleLinked: user.GoogleId is not null);
}