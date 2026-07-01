using SportSG.Domain.Entities;

namespace SportSG.Application.Repositories;

public interface IUnitOfWork : IAsyncDisposable
{
    IRepository<User>               Users               { get; }
    IRepository<Role>               Roles               { get; }
    IRepository<Partner>            Partners            { get; }
    IRepository<PartnerUserRole>    PartnerUserRoles    { get; }
    IRepository<Branch>             Branches            { get; }
    IRepository<SportType>          SportTypes          { get; }
    IRepository<BranchSportType>    BranchSportTypes    { get; }
    IRepository<Court>              Courts              { get; }
    IRepository<CourtPricingRule>   CourtPricingRules   { get; }
    IRepository<Booking>            Bookings            { get; }
    IRepository<Payment>            Payments            { get; }
    IRepository<CommissionLedger>   CommissionLedger    { get; }
    IRepository<Review>             Reviews             { get; }
    IRepository<Promotion>          Promotions          { get; }
    IRepository<Membership>         Memberships         { get; }
    IRepository<UserMembership>     UserMemberships     { get; }
    IRepository<LoyaltyTransaction> LoyaltyTransactions { get; }
    IRepository<Notification>       Notifications       { get; }
    IRepository<MaintenanceSchedule> Maintenances       { get; }

    // New entities
    IRepository<RefreshToken>    RefreshTokens    { get; }
    IRepository<Permission>      Permissions      { get; }
    IRepository<RolePermission>  RolePermissions  { get; }
    IRepository<CourtType>       CourtTypes       { get; }
    IRepository<CourtImage>      CourtImages      { get; }
    IRepository<CourtFacility>   CourtFacilities  { get; }
    IRepository<Schedule>        Schedules        { get; }
    IRepository<Holiday>         Holidays         { get; }
    IRepository<Favorite>        Favorites        { get; }
    IRepository<AuditLog>        AuditLogs        { get; }
    IRepository<PaymentLog>      PaymentLogs      { get; }
    IRepository<Coupon>          Coupons          { get; }
    IRepository<Banner>          Banners          { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);

    /// <summary>
    /// Chạy <paramref name="operation"/> trong 1 transaction, tương thích với
    /// SqlServerRetryingExecutionStrategy (EnableRetryOnFailure). Không dùng
    /// Database.BeginTransactionAsync() trực tiếp vì nó không hỗ trợ retry strategy.
    /// </summary>
    Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken ct = default);
}
