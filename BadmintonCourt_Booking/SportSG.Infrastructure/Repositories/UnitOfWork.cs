using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SportSG.Application.Repositories;
using SportSG.Domain.Entities;
using SportSG.Infrastructure.Data;

namespace SportSG.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext ctx) : IUnitOfWork
{
    public IRepository<User>               Users               => new Repository<User>(ctx);
    public IRepository<Role>               Roles               => new Repository<Role>(ctx);
    public IRepository<Partner>            Partners            => new Repository<Partner>(ctx);
    public IRepository<PartnerUserRole>    PartnerUserRoles    => new Repository<PartnerUserRole>(ctx);
    public IRepository<Branch>             Branches            => new Repository<Branch>(ctx);
    public IRepository<SportType>          SportTypes          => new Repository<SportType>(ctx);
    public IRepository<BranchSportType>    BranchSportTypes    => new Repository<BranchSportType>(ctx);
    public IRepository<Court>              Courts              => new Repository<Court>(ctx);
    public IRepository<CourtPricingRule>   CourtPricingRules   => new Repository<CourtPricingRule>(ctx);
    public IRepository<Booking>            Bookings            => new Repository<Booking>(ctx);
    public IRepository<Payment>            Payments            => new Repository<Payment>(ctx);
    public IRepository<CommissionLedger>   CommissionLedger    => new Repository<CommissionLedger>(ctx);
    public IRepository<Review>             Reviews             => new Repository<Review>(ctx);
    public IRepository<Promotion>          Promotions          => new Repository<Promotion>(ctx);
    public IRepository<Membership>         Memberships         => new Repository<Membership>(ctx);
    public IRepository<UserMembership>     UserMemberships     => new Repository<UserMembership>(ctx);
    public IRepository<LoyaltyTransaction> LoyaltyTransactions => new Repository<LoyaltyTransaction>(ctx);
    public IRepository<Notification>       Notifications       => new Repository<Notification>(ctx);
    public IRepository<MaintenanceSchedule> Maintenances       => new Repository<MaintenanceSchedule>(ctx);

    // ── New entities ──────────────────────────────────────────────
    public IRepository<RefreshToken>    RefreshTokens    => new Repository<RefreshToken>(ctx);
    public IRepository<Permission>      Permissions      => new Repository<Permission>(ctx);
    public IRepository<RolePermission>  RolePermissions  => new Repository<RolePermission>(ctx);
    public IRepository<CourtType>       CourtTypes       => new Repository<CourtType>(ctx);
    public IRepository<CourtImage>      CourtImages      => new Repository<CourtImage>(ctx);
    public IRepository<CourtFacility>   CourtFacilities  => new Repository<CourtFacility>(ctx);
    public IRepository<Schedule>        Schedules        => new Repository<Schedule>(ctx);
    public IRepository<Holiday>         Holidays         => new Repository<Holiday>(ctx);
    public IRepository<Favorite>        Favorites        => new Repository<Favorite>(ctx);
    public IRepository<AuditLog>        AuditLogs        => new Repository<AuditLog>(ctx);
    public IRepository<PaymentLog>      PaymentLogs      => new Repository<PaymentLog>(ctx);
    public IRepository<Coupon>          Coupons          => new Repository<Coupon>(ctx);
    public IRepository<Banner>          Banners          => new Repository<Banner>(ctx);

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => ctx.SaveChangesAsync(ct);

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct = default)
    {
        var strategy = ctx.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await ctx.Database.BeginTransactionAsync(ct);
            try
            {
                await operation(ct);
                await tx.CommitAsync(ct);
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });
    }

    public async ValueTask DisposeAsync()
        => await ctx.DisposeAsync();
}
