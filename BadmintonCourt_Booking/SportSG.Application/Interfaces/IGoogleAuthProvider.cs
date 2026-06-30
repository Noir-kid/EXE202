namespace SportSG.Application.Interfaces;

/// <summary>
/// Abstraction over Google OAuth — keeps Google library out of Application layer.
/// </summary>
public interface IGoogleAuthProvider
{
    /// <summary>
    /// Validate an id_token sent from the frontend (Google Identity Services / One Tap).
    /// Throws UnauthorizedAccessException if token is invalid.
    /// </summary>
    Task<GoogleUserInfo> ValidateIdTokenAsync(string idToken, CancellationToken ct = default);

    /// <summary>
    /// Exchange an authorization code (from server-side OAuth callback) for user info.
    /// Throws UnauthorizedAccessException if exchange fails.
    /// </summary>
    Task<GoogleUserInfo> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct = default);
}

public record GoogleUserInfo(
    string Sub,
    string Email,
    bool EmailVerified,
    string? GivenName,
    string? FamilyName,
    string? Picture
);
