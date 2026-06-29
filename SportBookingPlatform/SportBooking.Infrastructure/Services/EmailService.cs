using Microsoft.Extensions.Logging;
using SportBooking.Application.Common.Interfaces;

namespace SportBooking.Infrastructure.Services;

// Stub implementation — replace with SendGrid / SMTP in production
public class EmailService(ILogger<EmailService> logger) : IEmailService
{
    public Task SendBookingConfirmationAsync(string to, string bookingRef, DateTime bookingDate, CancellationToken ct = default)
    {
        logger.LogInformation("[EMAIL] BookingConfirmation -> {To} | Ref: {Ref} | Date: {Date}", to, bookingRef, bookingDate);
        return Task.CompletedTask;
    }

    public Task SendBookingCancellationAsync(string to, string bookingRef, CancellationToken ct = default)
    {
        logger.LogInformation("[EMAIL] BookingCancellation -> {To} | Ref: {Ref}", to, bookingRef);
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string to, string resetLink, CancellationToken ct = default)
    {
        logger.LogInformation("[EMAIL] PasswordReset -> {To} | Link: {Link}", to, resetLink);
        return Task.CompletedTask;
    }
}