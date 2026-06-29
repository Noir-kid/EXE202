using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SportSG.Application.DTOs.Auth;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.Application.Services;

public class AuthService(IUnitOfWork uow, IConfiguration cfg) : IAuthService
{
    // ── Register ────────────────────────────────────────────────

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await uow.Users.AnyAsync(u => u.Email == req.Email, ct))
            throw new InvalidOperationException("Email đã được đăng ký.");

        var customerRole = await uow.Roles.FirstOrDefaultAsync(r => r.Code == Roles.Customer, ct)
            ?? throw new Exception("Role không tồn tại.");

        var user = new User
        {
            Email     = req.Email.ToLower(),
            PasswordHash = Hash(req.Password),
            FirstName = req.FirstName,
            LastName  = req.LastName,
            Phone     = req.Phone,
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        return await BuildAuthResponseAsync(user, Roles.Customer, null, null, ct);
    }

    // ── Login ───────────────────────────────────────────────────

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var user = await uow.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower(), ct)
            ?? throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đã bị khóa.");

        if (user.PasswordHash == null || !Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng.");

        // Determine role and tenant scope
        var (role, partnerId, branchId) = await GetPrimaryRoleAsync(user.UserId, ct);

        return await BuildAuthResponseAsync(user, role, partnerId, branchId, ct);
    }

    // ── Google Login ────────────────────────────────────────────

    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest req, CancellationToken ct = default)
    {
        // Validate Google ID token via Google tokeninfo endpoint
        using var http = new HttpClient();
        var resp = await http.GetAsync(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={req.IdToken}", ct);
        if (!resp.IsSuccessStatusCode)
            throw new UnauthorizedAccessException("Google token không hợp lệ.");

        var payload = await resp.Content.ReadFromJsonAsync<GoogleTokenPayload>(cancellationToken: ct)
            ?? throw new UnauthorizedAccessException("Không đọc được Google token.");

        var user = await uow.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Sub || u.Email == payload.Email, ct);
        if (user is null)
        {
            user = new User
            {
                Email     = payload.Email,
                GoogleId  = payload.Sub,
                FirstName = payload.GivenName,
                LastName  = payload.FamilyName,
                AvatarUrl = payload.Picture,
                IsEmailVerified = true,
            };
            await uow.Users.AddAsync(user, ct);
            await uow.SaveChangesAsync(ct);
        }

        var (role, partnerId, branchId) = await GetPrimaryRoleAsync(user.UserId, ct);
        return await BuildAuthResponseAsync(user, role, partnerId, branchId, ct);
    }

    // ── Refresh ─────────────────────────────────────────────────

    public async Task<AuthResponse> RefreshAsync(RefreshRequest req, CancellationToken ct = default)
    {
        var user = await uow.Users.FirstOrDefaultAsync(
            u => u.RefreshToken == req.RefreshToken && u.RefreshTokenExpiry > DateTime.UtcNow, ct)
            ?? throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn.");

        var (role, partnerId, branchId) = await GetPrimaryRoleAsync(user.UserId, ct);
        return await BuildAuthResponseAsync(user, role, partnerId, branchId, ct);
    }

    public async Task LogoutAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await uow.Users.GetByIdAsync(userId, ct);
        if (user is null) return;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);
    }

    public Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req, CancellationToken ct = default)
        => throw new NotImplementedException("Implement per project needs");

    public Task ForgotPasswordAsync(ForgotPasswordRequest req, CancellationToken ct = default)
        => throw new NotImplementedException("Implement per project needs");

    public Task ResetPasswordAsync(ResetPasswordRequest req, CancellationToken ct = default)
        => throw new NotImplementedException("Implement per project needs");

    // ── Helpers ─────────────────────────────────────────────────

    private async Task<(string role, Guid? partnerId, Guid? branchId)> GetPrimaryRoleAsync(
        Guid userId, CancellationToken ct)
    {
        var pur = await uow.PartnerUserRoles.Query()
            .Where(p => p.UserId == userId && p.IsActive)
            .Include(p => p.Role)
            .OrderBy(p => p.Role.RoleId)   // lower RoleId = higher privilege
            .FirstOrDefaultAsync(ct);

        if (pur is null) return (Roles.Customer, null, null);
        return (pur.Role.Code, pur.PartnerId, pur.BranchId);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(
        User user, string role, Guid? partnerId, Guid? branchId, CancellationToken ct)
    {
        var expiry = DateTime.UtcNow.AddHours(double.Parse(cfg["Jwt:ExpireHours"] ?? "8"));
        var accessToken = GenerateJwt(user, role, partnerId, branchId, expiry);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(30);
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        return new AuthResponse(
            accessToken, refreshToken, expiry,
            new UserInfo(user.UserId, user.Email, user.FullName, user.AvatarUrl, role, partnerId, branchId));
    }

    private string GenerateJwt(User user, string role, Guid? partnerId, Guid? branchId, DateTime expiry)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Email,          user.Email),
            new(ClaimTypes.Role,           role),
            // Short-name aliases for FE jwtDecode
            new("userId",   user.UserId.ToString()),
            new("email",    user.Email),
            new("role",     role),
            new("fullName", user.FullName),
        };
        if (partnerId.HasValue) claims.Add(new("partnerId", partnerId.Value.ToString()));
        if (branchId.HasValue)  claims.Add(new("branchId",  branchId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer:   cfg["Jwt:Issuer"],
            audience: cfg["Jwt:Audience"],
            claims:   claims,
            expires:  expiry,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string Hash(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    private static bool Verify(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);
}

// ── Google token payload ─────────────────────────────────────

internal record GoogleTokenPayload(
    string Sub, string Email,
    string? GivenName, string? FamilyName, string? Picture);
