using SportBooking.Domain.Common;
using SportBooking.Domain.Enums;

namespace SportBooking.Domain.Entities;

public class User : AuditableEntity
{
    public string Email { get; set; } = default!;

    // Nullable — Google-only users have no password until they set one
    public string? PasswordHash { get; set; }

    public string FullName { get; set; } = default!;
    public string? Phone { get; set; }
    public string? Avatar { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public bool IsEmailVerified { get; set; } = false;

    // Google OAuth — subject (sub) claim from Google ID token
    public string? GoogleId { get; set; }

    // Refresh token stored hashed
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    // Tenant link — Owner/Staff belong to an Owner entity
    public Guid? OwnerId { get; set; }
    public Owner? Owner { get; set; }

    // Staff may be assigned to a specific branch
    public Guid? BranchId { get; set; }
    public Branch? Branch { get; set; }

    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
}