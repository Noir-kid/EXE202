using SportSG.Application.DTOs.Auth;

namespace SportSG.Application.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default);
    Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest req, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(RefreshRequest req, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, CancellationToken ct = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default);
}
