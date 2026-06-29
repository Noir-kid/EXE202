using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;

namespace SportBooking.Application.Commands.Auth;

public record LogoutCommand(Guid UserId, string RefreshToken) : IRequest<Result>;

public class LogoutCommandHandler(IUnitOfWork uow) : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand cmd, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(cmd.UserId, ct);
        if (user is null) return Result.Success(204);

        // Chỉ revoke nếu refresh token khớp — tránh user A logout user B
        if (user.RefreshToken is not null &&
            BCrypt.Net.BCrypt.Verify(cmd.RefreshToken, user.RefreshToken))
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;
            uow.Users.Update(user);
            await uow.SaveChangesAsync(ct);
        }

        return Result.Success(204);
    }
}