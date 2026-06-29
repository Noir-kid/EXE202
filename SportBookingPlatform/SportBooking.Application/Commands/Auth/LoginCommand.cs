using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Auth;

namespace SportBooking.Application.Commands.Auth;

public record LoginCommand(string Email, string Password) : IRequest<Result<AuthResponse>>;

public class LoginCommandHandler(IUnitOfWork uow, ITokenService tokenService)
    : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var email = cmd.Email.Trim().ToLower();
        var user = await uow.Users.FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted, ct);

        if (user is null || !user.IsActive)
            return Result<AuthResponse>.Unauthorized("Email hoặc mật khẩu không đúng.");

        // Google-only account chưa đặt mật khẩu
        if (user.PasswordHash is null)
            return Result<AuthResponse>.Unauthorized(
                "Tài khoản này được tạo bằng Google. Vui lòng đăng nhập bằng Google hoặc đặt mật khẩu trước.");

        if (!BCrypt.Net.BCrypt.Verify(cmd.Password, user.PasswordHash))
            return Result<AuthResponse>.Unauthorized("Email hoặc mật khẩu không đúng.");

        var refreshToken = tokenService.GenerateRefreshToken();
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
        user.UpdatedAt = DateTime.UtcNow;

        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        var accessToken = tokenService.GenerateAccessToken(user);
        return Result<AuthResponse>.Success(new AuthResponse(
            accessToken, refreshToken, 28800,
            new UserDto(user.Id, user.Email, user.FullName, user.Phone, user.Avatar,
                user.Role, user.OwnerId, user.IsEmailVerified,
                HasPassword: user.PasswordHash is not null,
                HasGoogleLinked: user.GoogleId is not null)));
    }
}