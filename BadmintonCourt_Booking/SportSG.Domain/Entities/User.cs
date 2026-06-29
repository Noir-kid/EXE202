namespace SportSG.Domain.Entities;

public class User : BaseEntity
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = null!;
    public string? PasswordHash { get; set; }
    public bool IsEmailVerified { get; set; }
    public string? GoogleId { get; set; }
    public string? PublicId { get; set; }               // Cloudinary avatar public ID
    public string? AvatarUrl { get; set; }
    public string? Phone { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public decimal Balance { get; set; }
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string FullName => $"{FirstName} {LastName}".Trim();

    // Navigation
    public ICollection<PartnerUserRole> PartnerUserRoles { get; set; } = [];
    public ICollection<Booking> Bookings { get; set; } = [];
    public ICollection<Review> Reviews { get; set; } = [];
    public ICollection<LoyaltyTransaction> LoyaltyTransactions { get; set; } = [];
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<UserMembership> UserMemberships { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<Favorite> Favorites { get; set; } = [];
}
