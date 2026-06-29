namespace SportBooking.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(string to, string bookingRef, DateTime bookingDate, CancellationToken ct = default);
    Task SendBookingCancellationAsync(string to, string bookingRef, CancellationToken ct = default);
    Task SendPasswordResetAsync(string to, string resetLink, CancellationToken ct = default);
}