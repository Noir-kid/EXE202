using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

public class EmailService(IConfiguration cfg, ILogger<EmailService> logger) : IEmailService
{
    private readonly string _host     = cfg["Email:Host"]     ?? "smtp.gmail.com";
    private readonly int    _port     = int.Parse(cfg["Email:Port"] ?? "587");
    private readonly string _user     = cfg["Email:Username"] ?? "";
    private readonly string _pass     = cfg["Email:Password"] ?? "";
    private readonly string _fromName = cfg["Email:FromName"] ?? "SportSG";

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        try
        {
            var msg = new MimeMessage();
            msg.From.Add(new MailboxAddress(_fromName, _user));
            msg.To.Add(MailboxAddress.Parse(to));
            msg.Subject = subject;
            msg.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_host, _port, SecureSocketOptions.StartTls, ct);
            await client.AuthenticateAsync(_user, _pass, ct);
            await client.SendAsync(msg, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }

    public Task SendTemplatedAsync(string to, string templateName, object model, CancellationToken ct = default)
    {
        // Simple template substitution — replace with Razor/Scriban for production
        var html = templateName switch
        {
            "booking-confirmed" => BuildBookingConfirmed(model),
            "password-reset"    => BuildPasswordReset(model),
            "otp"               => BuildOtp(model),
            _                   => $"<p>{model}</p>"
        };
        var subject = templateName switch
        {
            "booking-confirmed" => "Xác nhận đặt sân",
            "password-reset"    => "Đặt lại mật khẩu",
            "otp"               => "Mã xác thực SportSG",
            _                   => "Thông báo từ SportSG"
        };
        return SendAsync(to, subject, html, ct);
    }

    private static string BuildBookingConfirmed(object m) =>
        $"<h2>Đặt sân thành công!</h2><pre>{m}</pre>";

    private static string BuildPasswordReset(object m) =>
        $"<h2>Đặt lại mật khẩu</h2><p>Link reset: <a href='{m}'>{m}</a></p>";

    private static string BuildOtp(object m) =>
        $"<h2>Mã OTP của bạn: <strong>{m}</strong></h2><p>Mã có hiệu lực trong 5 phút.</p>";
}
