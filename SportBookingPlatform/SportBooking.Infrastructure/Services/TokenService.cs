using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Entities;

namespace SportBooking.Infrastructure.Services;

public class TokenService(IConfiguration config) : ITokenService
{
    private readonly string _secret = config["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret not configured.");
    private readonly string _issuer = config["Jwt:Issuer"] ?? "SportBooking";
    private readonly string _audience = config["Jwt:Audience"] ?? "SportBookingApp";
    private readonly int _expiryHours = int.Parse(config["Jwt:ExpiryHours"] ?? "8");

    public string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("fullName", user.FullName),
        };

        if (user.OwnerId.HasValue)
            claims.Add(new Claim("ownerId", user.OwnerId.Value.ToString()));

        if (user.BranchId.HasValue)
            claims.Add(new Claim("branchId", user.BranchId.Value.ToString()));

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_expiryHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public Guid? ValidateAccessToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateLifetime = false  // allow expired token for refresh flow
            }, out _);

            var idClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(idClaim, out var userId) ? userId : null;
        }
        catch
        {
            return null;
        }
    }
}