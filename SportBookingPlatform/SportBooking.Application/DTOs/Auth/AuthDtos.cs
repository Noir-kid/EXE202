using SportBooking.Domain.Enums;

namespace SportBooking.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? Phone = null
);

public record LoginRequest(
    string Email,
    string Password
);

/// <summary>
/// Frontend gửi Google ID Token sau khi user đăng nhập qua Google Sign-In SDK.
/// Flow: Google SDK → idToken → POST /api/auth/google → server verify → trả JWT
/// </summary>
public record GoogleLoginRequest(string IdToken);

public record RefreshTokenRequest(string RefreshToken);

public record LogoutRequest(string RefreshToken);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,          // seconds (28800 = 8 giờ)
    UserDto User
);

public record UserDto(
    Guid UserId,
    string Email,
    string FullName,
    string? Phone,
    string? Avatar,
    UserRole Role,
    Guid? OwnerId,
    bool IsEmailVerified = false,
    bool HasPassword = true,        // false = Google-only account (chưa set password)
    bool HasGoogleLinked = false    // true = đã liên kết Google
);

public record SetPasswordRequest(
    string NewPassword
);

public record LinkGoogleRequest(string IdToken);