namespace SportSG.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone
);

public record LoginRequest(string Email, string Password);

public record GoogleLoginRequest(string IdToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiry,
    UserInfo User
);

public record UserInfo(
    Guid UserId,
    string Email,
    string FullName,
    string? AvatarUrl,
    string Role,
    Guid? PartnerId,
    Guid? BranchId
);

public record RefreshRequest(string RefreshToken);

public record ChangePasswordRequest(string OldPassword, string NewPassword);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string NewPassword);
