using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Entities;
using SportBooking.Infrastructure.Data;

// Alias to avoid conflict with SportBooking.Infrastructure.Payment namespace
using PaymentEntity = SportBooking.Domain.Entities.Payment;

namespace SportBooking.Infrastructure.Repositories;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public IRepository<User> Users { get; } = new GenericRepository<User>(db);
    public IRepository<Owner> Owners { get; } = new GenericRepository<Owner>(db);
    public IRepository<Branch> Branches { get; } = new GenericRepository<Branch>(db);
    public IRepository<Court> Courts { get; } = new GenericRepository<Court>(db);
    public IRepository<Booking> Bookings { get; } = new GenericRepository<Booking>(db);
    public IRepository<PaymentEntity> Payments { get; } = new GenericRepository<PaymentEntity>(db);
    public IRepository<PaymentTransaction> PaymentTransactions { get; } = new GenericRepository<PaymentTransaction>(db);
    public IRepository<Review> Reviews { get; } = new GenericRepository<Review>(db);
    public IRepository<Promotion> Promotions { get; } = new GenericRepository<Promotion>(db);
    public IRepository<Notification> Notifications { get; } = new GenericRepository<Notification>(db);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default) =>
        await db.SaveChangesAsync(ct);

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, SemaphoreSlim>
        _locks = new();

    public async Task<T?> ExecuteWithLockAsync<T>(Func<Task<T>> action, string lockKey, TimeSpan timeout)
    {
        var sem = _locks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
        var acquired = await sem.WaitAsync(timeout);
        if (!acquired) return default;
        try { return await action(); }
        finally { sem.Release(); }
    }

    public async ValueTask DisposeAsync() => await db.DisposeAsync();
}