using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Auth;

namespace SportBooking.Application.Commands.Auth;

public record RefreshTokenCommand(string AccessToken, string RefreshToken) : IRequest<Result<AuthResponse>>;

public class RefreshTokenCommandHandler(IUnitOfWork uow, ITokenService tokenService)
    : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var userId = tokenService.ValidateAccessToken(cmd.AccessToken);
        if (userId is null)
            return Result<AuthResponse>.Unauthorized("Invalid access token.");

        var user = await uow.Users.GetByIdAsync(userId.Value, ct);
        if (user is null || user.RefreshToken is null || user.RefreshTokenExpiry < DateTime.UtcNow)
            return Result<AuthResponse>.Unauthorized("Refresh token expired or invalid.");

        if (!BCrypt.Net.BCrypt.Verify(cmd.RefreshToken, user.RefreshToken))
            return Result<AuthResponse>.Unauthorized("Invalid refresh token.");

        // Rotate refresh token
        var newRefreshToken = tokenService.GenerateRefreshToken();
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(newRefreshToken);
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
        user.UpdatedAt = DateTime.UtcNow;

        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        var accessToken = tokenService.GenerateAccessToken(user);
        return Result<AuthResponse>.Success(new AuthResponse(
            accessToken, newRefreshToken, 28800,
            new UserDto(user.Id, user.Email, user.FullName, user.Phone, user.Avatar, user.Role, user.OwnerId)));
    }
}