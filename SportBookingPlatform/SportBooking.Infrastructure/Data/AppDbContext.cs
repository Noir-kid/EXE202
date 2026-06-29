using Microsoft.EntityFrameworkCore;
using SportBooking.Domain.Common;
using SportBooking.Domain.Entities;

// Alias to avoid conflict with SportBooking.Infrastructure.Payment namespace
using PaymentEntity = SportBooking.Domain.Entities.Payment;

namespace SportBooking.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);
        mb.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Global soft-delete filter on all AuditableEntity types
        foreach (var entityType in mb.Model.GetEntityTypes()
            .Where(t => t.ClrType.IsAssignableTo(typeof(AuditableEntity))))
        {
            mb.Entity(entityType.ClrType)
              .HasQueryFilter(BuildIsDeletedFilter(entityType.ClrType));
        }
    }

    private static System.Linq.Expressions.LambdaExpression BuildIsDeletedFilter(Type type)
    {
        var param = System.Linq.Expressions.Expression.Parameter(type, "e");
        var prop = System.Linq.Expressions.Expression.Property(param, nameof(AuditableEntity.IsDeleted));
        var notDeleted = System.Linq.Expressions.Expression.Not(prop);
        return System.Linq.Expressions.Expression.Lambda(notDeleted, param);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return await base.SaveChangesAsync(ct);
    }
}