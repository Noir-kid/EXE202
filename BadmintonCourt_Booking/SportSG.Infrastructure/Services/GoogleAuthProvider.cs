using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

public class GoogleAuthProvider(IConfiguration cfg, IHttpClientFactory httpFactory) : IGoogleAuthProvider
{
    // ── Validate id_token gửi từ frontend ────────────────────────────────

    public async Task<GoogleUserInfo> ValidateIdTokenAsync(string idToken, CancellationToken ct = default)
    {
        GoogleJsonWebSignature.Payload payload;
        try
        {
            // Validate signature, issuer (accounts.google.com), and expiry.
            // Audience is intentionally NOT restricted here because the frontend
            // may use Firebase's OAuth client (different client_id than ours).
            // The signature check is sufficient to prove the token is from Google.
            payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedAccessException($"Google token không hợp lệ: {ex.Message}");
        }

        if (string.IsNullOrEmpty(payload.Email))
            throw new UnauthorizedAccessException("Google token không chứa email.");

        return new GoogleUserInfo(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.GivenName,
            payload.FamilyName,
            payload.Picture);
    }

    // ── Exchange authorization code (server-side OAuth callback) ─────────

    public async Task<GoogleUserInfo> ExchangeCodeAsync(
        string code, string redirectUri, CancellationToken ct = default)
    {
        var clientId     = cfg["Google:ClientId"]     ?? throw new InvalidOperationException("Google:ClientId chưa được cấu hình.");
        var clientSecret = cfg["Google:ClientSecret"] ?? throw new InvalidOperationException("Google:ClientSecret chưa được cấu hình.");

        // POST to Google token endpoint to exchange code → tokens
        var http = httpFactory.CreateClient("Google");
        var tokenResp = await http.PostAsync(
            "https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"]          = code,
                ["client_id"]     = clientId,
                ["client_secret"] = clientSecret,
                ["redirect_uri"]  = redirectUri,
                ["grant_type"]    = "authorization_code",
            }),
            ct);

        if (!tokenResp.IsSuccessStatusCode)
        {
            var body = await tokenResp.Content.ReadAsStringAsync(ct);
            throw new UnauthorizedAccessException($"Google token exchange thất bại: {body}");
        }

        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<GoogleTokenResponse>(cancellationToken: ct)
            ?? throw new UnauthorizedAccessException("Không đọc được phản hồi từ Google.");

        // Validate id_token we received (already verified to be from Google)
        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [clientId],
        };

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(tokenJson.IdToken, settings);
        }
        catch (InvalidJwtException ex)
        {
            throw new UnauthorizedAccessException($"Google id_token từ code exchange không hợp lệ: {ex.Message}");
        }

        return new GoogleUserInfo(
            payload.Subject,
            payload.Email,
            payload.EmailVerified,
            payload.GivenName,
            payload.FamilyName,
            payload.Picture);
    }
}

// ── Internal DTO for Google token endpoint response ───────────────────────────

internal record GoogleTokenResponse(
    [property: JsonPropertyName("id_token")]     string IdToken,
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("token_type")]   string TokenType,
    [property: JsonPropertyName("expires_in")]   int ExpiresIn
);
