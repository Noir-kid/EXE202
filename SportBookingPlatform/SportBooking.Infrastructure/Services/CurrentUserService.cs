using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Enums;

namespace SportBooking.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid UserId =>
        Guid.TryParse(Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : Guid.Empty;

    public string Email =>
        Principal?.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

    public UserRole Role =>
        Enum.TryParse<UserRole>(Principal?.FindFirst(ClaimTypes.Role)?.Value, out var role)
            ? role : UserRole.Customer;

    public string FullName =>
        Principal?.FindFirst("fullName")?.Value ?? string.Empty;

    public Guid? OwnerId =>
        Guid.TryParse(Principal?.FindFirst("ownerId")?.Value, out var id) ? id : null;

    public Guid? BranchId =>
        Guid.TryParse(Principal?.FindFirst("branchId")?.Value, out var id) ? id : null;

    public bool IsAuthenticated =>
        Principal?.Identity?.IsAuthenticated ?? false;
}