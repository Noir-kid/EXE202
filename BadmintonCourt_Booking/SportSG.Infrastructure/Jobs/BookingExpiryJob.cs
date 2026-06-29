using Hangfire;
using Microsoft.EntityFrameworkCore;
using SportSG.Application.Interfaces;
using SportSG.Domain.Enums;
using SportSG.Infrastructure.Data;

namespace SportSG.Infrastructure.Jobs;

public class BookingExpiryJob(AppDbContext db, INotificationHub hub, ILogger<BookingExpiryJob> logger)
{
    [AutomaticRetry(Attempts = 3)]
    public async Task ExpireUnpaidBookingsAsync()
    {
        var threshold = DateTime.UtcNow.AddMinutes(-15);

        var expired = await db.Bookings
            .Where(b => b.Status == BookingStatus.Pending && b.CreatedAt < threshold)
            .ToListAsync();

        if (expired.Count == 0) return;

        foreach (var b in expired)
        {
            b.Status = BookingStatus.Cancelled;
            await hub.SendToUserAsync(b.CustomerId, "booking.expired",
                new { b.BookingId, Message = "Booking expired due to payment timeout." });
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Expired {Count} unpaid bookings", expired.Count);
    }
}
