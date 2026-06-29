using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Auth;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Auth;

public record RegisterCommand(
    string Email,
    string Password,
    string FullName,
    string? Phone
) : IRequest<Result<AuthResponse>>;

public class RegisterCommandHandler(IUnitOfWork uow, ITokenService tokenService)
    : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var normalizedEmail = cmd.Email.Trim().ToLower();

        var existing = await uow.Users.FirstOrDefaultAsync(
            u => u.Email == normalizedEmail && !u.IsDeleted, ct);

        if (existing is not null)
        {
            // Email đã tồn tại với tài khoản Google-only — set password để kích hoạt đăng nhập email
            if (existing.PasswordHash is null && existing.GoogleId is not null)
            {
                existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(cmd.Password);
                existing.UpdatedAt = DateTime.UtcNow;

                var rt = tokenService.GenerateRefreshToken();
                existing.RefreshToken = BCrypt.Net.BCrypt.HashPassword(rt);
                existing.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

                uow.Users.Update(existing);
                await uow.SaveChangesAsync(ct);

                var at = tokenService.GenerateAccessToken(existing);
                return Result<AuthResponse>.Success(BuildResponse(at, rt, existing), 201);
            }

            return Result<AuthResponse>.Failure("Email này đã được sử dụng.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(cmd.Password),
            FullName = cmd.FullName.Trim(),
            Phone = cmd.Phone?.Trim(),
            Role = UserRole.Customer,
            IsEmailVerified = false
        };

        var refreshToken = tokenService.GenerateRefreshToken();
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        var accessToken = tokenService.GenerateAccessToken(user);
        return Result<AuthResponse>.Success(BuildResponse(accessToken, refreshToken, user), 201);
    }

    private static AuthResponse BuildResponse(string accessToken, string refreshToken, User user) =>
        new(accessToken, refreshToken, 28800,
            new UserDto(user.Id, user.Email, user.FullName, user.Phone, user.Avatar,
                user.Role, user.OwnerId, user.IsEmailVerified,
                HasPassword: user.PasswordHash is not null,
                HasGoogleLinked: user.GoogleId is not null));
}