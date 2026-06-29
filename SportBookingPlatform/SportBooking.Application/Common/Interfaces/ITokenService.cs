using SportBooking.Domain.Entities;

namespace SportBooking.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? ValidateAccessToken(string token);
}