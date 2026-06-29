using Hangfire;
using Microsoft.EntityFrameworkCore;
using SportSG.Application.Interfaces;
using SportSG.Domain.Enums;
using SportSG.Infrastructure.Data;

namespace SportSG.Infrastructure.Jobs;

public class BookingReminderJob(AppDbContext db, IEmailService email, INotificationHub hub, ILogger<BookingReminderJob> logger)
{
    [AutomaticRetry(Attempts = 2)]
    public async Task SendRemindersAsync()
    {
        var window = DateTime.UtcNow.AddHours(1);
        var start  = window.AddMinutes(-5);

        // EF Core không thể dịch DateOnly.ToDateTime() sang SQL
        // → Lọc theo date ở SQL (broad), rồi lọc chính xác theo time ở memory
        var startDate  = DateOnly.FromDateTime(start);
        var windowDate = DateOnly.FromDateTime(window);

        var candidates = await db.Bookings
            .Include(b => b.Customer)
            .Include(b => b.Court).ThenInclude(c => c.Branch)
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.BookingDate >= startDate
                     && b.BookingDate <= windowDate)
            .ToListAsync();

        // Lọc chính xác theo time ở memory (an toàn, kể cả trường hợp qua nửa đêm)
        var upcoming = candidates
            .Where(b => b.BookingDate.ToDateTime(b.StartTime) >= start
                     && b.BookingDate.ToDateTime(b.StartTime) <= window)
            .ToList();

        foreach (var b in upcoming)
        {
            await hub.SendToUserAsync(b.CustomerId, "booking.reminder", new
            {
                b.BookingId,
                Court  = b.Court.Name,
                Branch = b.Court.Branch.Name,
                Time   = b.StartTime.ToString("HH:mm"),
                Date   = b.BookingDate.ToString("dd/MM/yyyy"),
            });

            if (!string.IsNullOrEmpty(b.Customer.Email))
                await email.SendTemplatedAsync(b.Customer.Email, "booking-reminder", new
                {
                    CustomerName = b.Customer.FullName,
                    b.Court.Name,
                    Time = b.StartTime.ToString("HH:mm"),
                    Date = b.BookingDate.ToString("dd/MM/yyyy"),
                });
        }

        if (upcoming.Count > 0)
            logger.LogInformation("Sent {Count} booking reminders", upcoming.Count);
    }
}
