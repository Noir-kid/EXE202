namespace SportBooking.Application.Common.Interfaces;

public interface IGoogleAuthService
{
    /// <summary>
    /// Verify Google ID token (obtained by frontend via Google Sign-In SDK).
    /// Returns null if the token is invalid or expired.
    /// </summary>
    Task<GoogleUserInfo?> VerifyIdTokenAsync(string idToken, CancellationToken ct = default);
}

public record GoogleUserInfo(
    string GoogleId,        // Google subject (sub) claim — unique per Google account
    string Email,
    string FullName,
    string? Picture,        // Profile photo URL from Google
    bool EmailVerified
);