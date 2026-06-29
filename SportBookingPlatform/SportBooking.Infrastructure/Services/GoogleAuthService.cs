using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SportBooking.Application.Common.Interfaces;

namespace SportBooking.Infrastructure.Services;

public class GoogleAuthService(IConfiguration config, ILogger<GoogleAuthService> logger) : IGoogleAuthService
{
    // Lấy ClientId từ appsettings — frontend và backend phải dùng cùng ClientId
    private readonly string _clientId = config["Google:ClientId"]
        ?? throw new InvalidOperationException("Google:ClientId not configured.");

    public async Task<GoogleUserInfo?> VerifyIdTokenAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _clientId }
            };

            // Google.Apis.Auth tự động verify:
            //   1. Chữ ký RSA với Google public key
            //   2. Token chưa hết hạn (exp claim)
            //   3. Audience (aud) khớp với ClientId
            //   4. Issuer là accounts.google.com hoặc https://accounts.google.com
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            return new GoogleUserInfo(
                GoogleId: payload.Subject,               // Google unique user ID
                Email: payload.Email,
                FullName: payload.Name ?? payload.Email,
                Picture: payload.Picture,
                EmailVerified: payload.EmailVerified
            );
        }
        catch (InvalidJwtException ex)
        {
            // Token không hợp lệ, đã hết hạn, hoặc sai audience
            logger.LogWarning("Google token validation failed: {Message}", ex.Message);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error verifying Google token.");
            return null;
        }
    }
}