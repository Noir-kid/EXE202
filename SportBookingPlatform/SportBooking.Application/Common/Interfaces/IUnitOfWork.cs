using SportBooking.Domain.Entities;

namespace SportBooking.Application.Common.Interfaces;

public interface IUnitOfWork : IAsyncDisposable
{
    IRepository<User> Users { get; }
    IRepository<Owner> Owners { get; }
    IRepository<Branch> Branches { get; }
    IRepository<Court> Courts { get; }
    IRepository<Booking> Bookings { get; }
    IRepository<Payment> Payments { get; }
    IRepository<PaymentTransaction> PaymentTransactions { get; }
    IRepository<Review> Reviews { get; }
    IRepository<Promotion> Promotions { get; }
    IRepository<Notification> Notifications { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);

    // Pessimistic locking for double-booking prevention
    Task<T?> ExecuteWithLockAsync<T>(Func<Task<T>> action, string lockKey, TimeSpan timeout);
}
