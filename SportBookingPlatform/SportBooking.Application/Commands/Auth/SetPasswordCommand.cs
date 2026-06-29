using MediatR;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;

namespace SportBooking.Application.Commands.Auth;

/// <summary>
/// Cho phép Google-only user đặt mật khẩu lần đầu,
/// hoặc user đã có tài khoản đổi mật khẩu.
/// </summary>
public record SetPasswordCommand(Guid UserId, string? CurrentPassword, string NewPassword)
    : IRequest<Result>;

public class SetPasswordCommandHandler(IUnitOfWork uow) : IRequestHandler<SetPasswordCommand, Result>
{
    public async Task<Result> Handle(SetPasswordCommand cmd, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(cmd.UserId, ct);
        if (user is null) return Result.NotFound("User not found.");

        // Nếu đã có password thì phải xác nhận password cũ
        if (user.PasswordHash is not null)
        {
            if (string.IsNullOrWhiteSpace(cmd.CurrentPassword))
                return Result.Failure("Cần nhập mật khẩu hiện tại.");

            if (!BCrypt.Net.BCrypt.Verify(cmd.CurrentPassword, user.PasswordHash))
                return Result.Failure("Mật khẩu hiện tại không đúng.");
        }

        if (cmd.NewPassword.Length < 6)
            return Result.Failure("Mật khẩu mới phải có ít nhất 6 ký tự.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(cmd.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        return Result.Success();
    }
}