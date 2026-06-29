using Hangfire;

namespace SportSG.Infrastructure.Jobs;

/// <summary>
/// Registers all Hangfire recurring jobs at application startup.
/// Called once from Program.cs after app.Build().
/// </summary>
public static class HangfireJobScheduler
{
    public static void Schedule()
    {
        // Every minute: expire bookings unpaid for more than 15 minutes
        RecurringJob.AddOrUpdate<BookingExpiryJob>(
            recurringJobId: "booking-expiry",
            methodCall:     j => j.ExpireUnpaidBookingsAsync(),
            cronExpression: Cron.Minutely(),
            options: new RecurringJobOptions
            {
                TimeZone = TimeZoneInfo.Utc,
                QueueName = "critical",
            });

        // Every 30 minutes: send reminders for bookings starting in ~1 hour
        RecurringJob.AddOrUpdate<BookingReminderJob>(
            recurringJobId: "booking-reminder",
            methodCall:     j => j.SendRemindersAsync(),
            cronExpression: "*/30 * * * *",
            options: new RecurringJobOptions
            {
                TimeZone  = TimeZoneInfo.Utc,
                QueueName = "default",
            });
    }
}
