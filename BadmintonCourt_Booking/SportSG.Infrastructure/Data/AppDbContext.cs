using Microsoft.EntityFrameworkCore;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;

namespace SportSG.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<PartnerUserRole> PartnerUserRoles => Set<PartnerUserRole>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<SportType> SportTypes => Set<SportType>();
    public DbSet<BranchSportType> BranchSportTypes => Set<BranchSportType>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<CourtPricingRule> CourtPricingRules => Set<CourtPricingRule>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CommissionLedger> CommissionLedger => Set<CommissionLedger>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<UserMembership> UserMemberships => Set<UserMembership>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<MaintenanceSchedule> MaintenanceSchedules => Set<MaintenanceSchedule>();

    // ── New entities ──────────────────────────────────────────────
    public DbSet<RefreshToken>      RefreshTokens  => Set<RefreshToken>();
    public DbSet<Permission>        Permissions    => Set<Permission>();
    public DbSet<RolePermission>    RolePermissions => Set<RolePermission>();
    public DbSet<CourtType>         CourtTypes     => Set<CourtType>();
    public DbSet<CourtImage>        CourtImages    => Set<CourtImage>();
    public DbSet<CourtFacility>     CourtFacilities => Set<CourtFacility>();
    public DbSet<Schedule>          Schedules      => Set<Schedule>();
    public DbSet<Holiday>           Holidays       => Set<Holiday>();
    public DbSet<Favorite>          Favorites      => Set<Favorite>();
    public DbSet<AuditLog>          AuditLogs      => Set<AuditLog>();
    public DbSet<PaymentLog>        PaymentLogs    => Set<PaymentLog>();
    public DbSet<Coupon>            Coupons        => Set<Coupon>();
    public DbSet<Banner>            Banners        => Set<Banner>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ── User ──────────────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.HasKey(x => x.UserId);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Balance).HasPrecision(18, 2);
            e.Ignore(x => x.FullName);
        });

        // ── Partner ───────────────────────────────────────────────
        mb.Entity<Partner>(e =>
        {
            e.HasKey(x => x.PartnerId);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.CommissionRate).HasPrecision(5, 2);
        });

        // ── PartnerUserRole ───────────────────────────────────────
        mb.Entity<PartnerUserRole>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.PartnerId, x.BranchId, x.RoleId }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.PartnerUserRoles).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Partner).WithMany(p => p.UserRoles).HasForeignKey(x => x.PartnerId);
            e.HasOne(x => x.Branch).WithMany(b => b.UserRoles).HasForeignKey(x => x.BranchId);
            e.HasOne(x => x.Role).WithMany(r => r.PartnerUserRoles).HasForeignKey(x => x.RoleId);
        });

        // ── Branch ────────────────────────────────────────────────
        mb.Entity<Branch>(e =>
        {
            e.HasKey(x => x.BranchId);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Latitude).HasPrecision(9, 6);
            e.Property(x => x.Longitude).HasPrecision(9, 6);
            e.HasOne(x => x.Partner).WithMany(p => p.Branches).HasForeignKey(x => x.PartnerId);
        });

        // ── BranchSportType ───────────────────────────────────────
        mb.Entity<BranchSportType>(e =>
        {
            e.HasKey(x => new { x.BranchId, x.SportTypeId });
            e.HasOne(x => x.Branch).WithMany(b => b.BranchSportTypes).HasForeignKey(x => x.BranchId);
            e.HasOne(x => x.SportType).WithMany(s => s.BranchSportTypes).HasForeignKey(x => x.SportTypeId);
        });

        // ── Court ─────────────────────────────────────────────────
        mb.Entity<Court>(e =>
        {
            e.HasKey(x => x.CourtId);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.BasePrice).HasPrecision(10, 2);
            e.HasOne(x => x.Branch).WithMany(b => b.Courts).HasForeignKey(x => x.BranchId);
            e.HasOne(x => x.SportType).WithMany(s => s.Courts).HasForeignKey(x => x.SportTypeId);
        });

        mb.Entity<CourtPricingRule>(e =>
        {
            e.HasKey(x => x.RuleId);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.HasOne(x => x.Court).WithMany(c => c.PricingRules).HasForeignKey(x => x.CourtId);
        });

        // ── Booking ───────────────────────────────────────────────
        mb.Entity<Booking>(e =>
        {
            e.HasKey(x => x.BookingId);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.BaseAmount).HasPrecision(10, 2);
            e.Property(x => x.DiscountAmount).HasPrecision(10, 2);
            e.Property(x => x.TotalAmount).HasPrecision(10, 2);
            e.HasOne(x => x.Customer).WithMany(u => u.Bookings).HasForeignKey(x => x.CustomerId);
            e.HasOne(x => x.Court).WithMany(c => c.Bookings).HasForeignKey(x => x.CourtId);
            e.HasOne(x => x.Promotion).WithMany(p => p.Bookings).HasForeignKey(x => x.PromotionId).IsRequired(false);
        });

        // ── Payment ───────────────────────────────────────────────
        mb.Entity<Payment>(e =>
        {
            e.HasKey(x => x.PaymentId);
            e.Property(x => x.Method).HasConversion<string>();
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.Amount).HasPrecision(10, 2);
            e.HasOne(x => x.Booking).WithMany(b => b.Payments).HasForeignKey(x => x.BookingId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
        });

        mb.Entity<CommissionLedger>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.GrossAmount).HasPrecision(10, 2);
            e.Property(x => x.CommissionRate).HasPrecision(5, 2);
            e.Property(x => x.CommissionAmt).HasPrecision(10, 2);
            e.Property(x => x.NetAmount).HasPrecision(10, 2);
            e.HasOne(x => x.Payment).WithOne(p => p.Commission).HasForeignKey<CommissionLedger>(x => x.PaymentId);
            e.HasOne(x => x.Partner).WithMany().HasForeignKey(x => x.PartnerId);
        });

        // ── Review ────────────────────────────────────────────────
        mb.Entity<Review>(e =>
        {
            e.HasKey(x => x.ReviewId);
            e.HasIndex(x => x.BookingId).IsUnique();
            e.HasOne(x => x.Booking).WithOne(b => b.Review).HasForeignKey<Review>(x => x.BookingId);
            e.HasOne(x => x.User).WithMany(u => u.Reviews).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Court).WithMany(c => c.Reviews).HasForeignKey(x => x.CourtId);
        });

        // ── Promotion ─────────────────────────────────────────────
        mb.Entity<Promotion>(e =>
        {
            e.HasKey(x => x.PromotionId);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.DiscountType).HasConversion<string>();
            e.Property(x => x.DiscountValue).HasPrecision(10, 2);
            e.Property(x => x.MinOrderAmount).HasPrecision(10, 2);
            e.Property(x => x.MaxDiscount).HasPrecision(10, 2);
            e.HasOne(x => x.Partner).WithMany(p => p.Promotions).HasForeignKey(x => x.PartnerId).IsRequired(false);
        });

        // ── Membership ────────────────────────────────────────────
        mb.Entity<Membership>(e =>
        {
            e.HasKey(x => x.MembershipId);
            e.Property(x => x.Price).HasPrecision(10, 2);
            e.Property(x => x.DiscountPercent).HasPrecision(5, 2);
            e.Property(x => x.LoyaltyMultiplier).HasPrecision(5, 2);
            e.HasOne(x => x.Partner).WithMany(p => p.Memberships).HasForeignKey(x => x.PartnerId);
        });

        mb.Entity<UserMembership>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>();
            e.Property(x => x.PaidAmount).HasPrecision(10, 2);
            e.HasOne(x => x.User).WithMany(u => u.UserMemberships).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Membership).WithMany(m => m.UserMemberships).HasForeignKey(x => x.MembershipId);
        });

        // ── Loyalty ───────────────────────────────────────────────
        mb.Entity<LoyaltyTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.User).WithMany(u => u.LoyaltyTransactions).HasForeignKey(x => x.UserId);
        });

        // ── Notification ──────────────────────────────────────────
        mb.Entity<Notification>(e =>
        {
            e.HasKey(x => x.NotificationId);
            e.Property(x => x.Type).HasConversion<string>();
            e.HasOne(x => x.User).WithMany(u => u.Notifications).HasForeignKey(x => x.UserId);
        });

        // ── Maintenance ───────────────────────────────────────────
        mb.Entity<MaintenanceSchedule>(e =>
        {
            e.HasKey(x => x.MaintenanceId);
            e.HasOne(x => x.Court).WithMany(c => c.MaintenanceSchedules).HasForeignKey(x => x.CourtId);
        });

        // ── RefreshToken ──────────────────────────────────────────
        mb.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Token).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId);
        });

        // ── Permission / RolePermission ───────────────────────────
        mb.Entity<Permission>(e =>
        {
            e.HasKey(x => x.PermissionId);
            e.HasIndex(x => x.Code).IsUnique();
        });
        mb.Entity<RolePermission>(e =>
        {
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne(x => x.Role).WithMany(r => r.RolePermissions).HasForeignKey(x => x.RoleId);
            e.HasOne(x => x.Permission).WithMany(p => p.RolePermissions).HasForeignKey(x => x.PermissionId);
        });

        // ── CourtType / CourtImage / CourtFacility ────────────────
        mb.Entity<CourtType>(e => e.HasKey(x => x.CourtTypeId));
        mb.Entity<CourtImage>(e =>
        {
            e.HasKey(x => x.CourtImageId);
            e.HasOne(x => x.Court).WithMany(c => c.Images).HasForeignKey(x => x.CourtId);
        });
        mb.Entity<CourtFacility>(e =>
        {
            e.HasKey(x => x.CourtFacilityId);
            e.HasOne(x => x.Court).WithMany(c => c.Facilities).HasForeignKey(x => x.CourtId);
        });
        mb.Entity<Court>(e => e.HasOne(x => x.CourtType).WithMany(t => t.Courts).HasForeignKey(x => x.CourtTypeId));

        // ── Schedule / Holiday ────────────────────────────────────
        mb.Entity<Schedule>(e =>
        {
            e.HasKey(x => x.ScheduleId);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId);
        });
        mb.Entity<Holiday>(e =>
        {
            e.HasKey(x => x.HolidayId);
            e.HasOne(x => x.Branch).WithMany().HasForeignKey(x => x.BranchId);
        });

        // ── Favorite ──────────────────────────────────────────────
        mb.Entity<Favorite>(e =>
        {
            e.HasKey(x => x.FavoriteId);
            e.HasIndex(x => new { x.UserId, x.CourtId }).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.Favorites).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Court).WithMany(c => c.Favorites).HasForeignKey(x => x.CourtId);
        });

        // ── AuditLog ──────────────────────────────────────────────
        mb.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.AuditLogId);
            e.Property(x => x.OldValues).HasColumnType("nvarchar(max)");
            e.Property(x => x.NewValues).HasColumnType("nvarchar(max)");
        });

        // ── PaymentLog ────────────────────────────────────────────
        mb.Entity<PaymentLog>(e =>
        {
            e.HasKey(x => x.PaymentLogId);
            e.Property(x => x.Gateway).HasConversion<string>();
            e.Property(x => x.RawRequest).HasColumnType("nvarchar(max)");
            e.Property(x => x.RawResponse).HasColumnType("nvarchar(max)");
        });

        // ── Coupon ────────────────────────────────────────────────
        mb.Entity<Coupon>(e =>
        {
            e.HasKey(x => x.CouponId);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.DiscountType).HasConversion<string>();
            e.Property(x => x.DiscountValue).HasPrecision(10, 2);
            e.Property(x => x.MinOrderAmount).HasPrecision(10, 2);
            e.Property(x => x.MaxDiscount).HasPrecision(10, 2);
        });

        // ── Banner ────────────────────────────────────────────────
        mb.Entity<Banner>(e =>
        {
            e.HasKey(x => x.BannerId);
            e.Property(x => x.Position).HasConversion<string>();
        });

        // SQL Server does not support multiple cascade paths to the same table.
        // Restrict all cascade deletes — application layer handles cascades explicitly.
        foreach (var fk in mb.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            fk.DeleteBehavior = DeleteBehavior.Restrict;

        // Seed data đã chuyển sang sql/demo-data.sql
    }
}
