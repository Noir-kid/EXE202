using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SportBooking.Domain.Enums;
using SportBooking.Infrastructure.Data;

namespace SportBooking.Infrastructure.BackgroundJobs;

/// <summary>
/// Runs every 5 minutes via Hangfire.
/// Marks Pending bookings as Expired when ExpiresAt has passed.
/// </summary>
public class BookingExpiryJob(AppDbContext db, ILogger<BookingExpiryJob> logger)
{
    public async Task ExecuteAsync()
    {
        var now = DateTime.UtcNow;
        var expired = await db.Bookings
            .Where(b => b.Status == BookingStatus.Pending &&
                        b.ExpiresAt.HasValue &&
                        b.ExpiresAt.Value < now &&
                        !b.IsDeleted)
            .ToListAsync();

        if (expired.Count == 0) return;

        foreach (var booking in expired)
        {
            booking.Status = BookingStatus.Expired;
            booking.UpdatedAt = now;
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Expired {Count} pending bookings.", expired.Count);
    }
}