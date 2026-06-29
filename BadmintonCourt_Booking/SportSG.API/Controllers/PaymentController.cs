using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Application.Interfaces;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;
using SportSG.Infrastructure.Services;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentController(
    IUnitOfWork uow,
    VnPayGateway vnPay,
    MoMoGateway moMo,
    INotificationHub hub,
    ILogger<PaymentController> logger) : ControllerBase
{
    // ── Danh sách thanh toán ─────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var role      = HttpContext.GetRole();
        var userId    = HttpContext.GetUserId();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Payments.Query()
            .Include(p => p.Booking).ThenInclude(b => b.Court).ThenInclude(c => c.Branch)
            .Include(p => p.User)
            .AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(p => p.Booking.Court.Branch.PartnerId == partnerId),
            Roles.BranchManager => q.Where(p => p.Booking.Court.BranchId == branchId),
            Roles.Staff         => q.Where(p => p.Booking.Court.BranchId == branchId),
            Roles.Customer      => q.Where(p => p.UserId == userId),
            _                   => throw new UnauthorizedAccessException()
        };

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new {
                p.PaymentId, p.BookingId,
                p.Amount, p.Method, p.Status, p.TransactionRef, p.PaidAt, p.CreatedAt,
                UserName   = p.User.FirstName + " " + p.User.LastName,
                CourtName  = p.Booking.Court.Name,
                BranchName = p.Booking.Court.Branch.Name,
            })
            .ToListAsync(ct);

        return Ok(new { items, total, page, pageSize });
    }

    // ── Tạo Payment + lấy URL thanh toán ────────────────────────

    /// <summary>
    /// Khởi tạo thanh toán online (VNPay/MoMo).
    /// Trả về paymentUrl để redirect người dùng.
    /// </summary>
    [HttpPost("initiate")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Initiate(
        [FromBody] InitiatePaymentRequest req, CancellationToken ct)
    {
        // 1. Lấy booking
        var booking = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch)
            .FirstOrDefaultAsync(b => b.BookingId == req.BookingId
                                   && b.CustomerId == HttpContext.GetUserId(), ct);

        if (booking is null)
            return NotFound(new { error = "Booking không tồn tại." });

        if (booking.Status != BookingStatus.Pending)
            return BadRequest(new { error = $"Booking ở trạng thái '{booking.Status}' không thể thanh toán." });

        // 2. Idempotency: nếu đã có payment Pending cùng method → trả lại
        var existing = await uow.Payments.FirstOrDefaultAsync(
            p => p.BookingId == req.BookingId
              && p.Status == PaymentStatus.Pending
              && p.Method == req.Method, ct);

        if (existing is not null && !string.IsNullOrEmpty(existing.GatewayResponse))
            return Ok(new { paymentId = existing.PaymentId, paymentUrl = existing.GatewayResponse });

        // 3. Tạo Payment record
        var payment = new Payment
        {
            BookingId = booking.BookingId,
            UserId    = HttpContext.GetUserId(),
            Amount    = booking.TotalAmount,
            Method    = req.Method,
            Status    = PaymentStatus.Pending,
        };
        await uow.Payments.AddAsync(payment, ct);
        await uow.SaveChangesAsync(ct);

        // 4. Gọi gateway
        var gatewayRequest = new PaymentRequest(
            BookingId : booking.BookingId,
            Amount    : booking.TotalAmount,
            OrderInfo : $"Dat san {booking.Court.Name} ngay {booking.BookingDate:dd/MM/yyyy}",
            ReturnUrl : req.ReturnUrl,
            IpAddress : HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1");

        PaymentResult gatewayResult;
        try
        {
            gatewayResult = req.Method switch
            {
                PaymentMethod.VNPay => await vnPay.CreatePaymentUrlAsync(gatewayRequest, ct),
                PaymentMethod.MoMo  => await moMo.CreatePaymentUrlAsync(gatewayRequest, ct),
                _ => throw new ArgumentException($"Method {req.Method} không hỗ trợ online payment.")
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Gateway error for booking {BookingId}", req.BookingId);
            return StatusCode(502, new { error = "Cổng thanh toán không phản hồi. Vui lòng thử lại." });
        }

        if (!gatewayResult.Success)
            return BadRequest(new { error = gatewayResult.Message ?? "Không tạo được URL thanh toán." });

        // 5. Lưu TransactionRef + PaymentUrl để idempotency check
        payment.TransactionRef   = gatewayResult.TransactionId;
        payment.GatewayResponse  = gatewayResult.PaymentUrl; // Lưu tạm URL
        uow.Payments.Update(payment);
        await uow.SaveChangesAsync(ct);

        return Ok(new
        {
            paymentId  = payment.PaymentId,
            paymentUrl = gatewayResult.PaymentUrl,
            expiresAt  = DateTime.UtcNow.AddMinutes(15),
        });
    }

    // ── VNPay IPN Callback ────────────────────────────────────────

    /// <summary>
    /// VNPay IPN (Instant Payment Notification) — gọi từ server VNPay.
    /// KHÔNG authenticate vì không có Bearer token.
    /// Response phải là plain text "RspCode=00&Message=OK".
    /// </summary>
    [HttpGet("vnpay/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayCallback(CancellationToken ct)
    {
        var rawQuery = HttpContext.Request.QueryString.Value ?? "";
        var ip       = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";

        logger.LogInformation("VNPay IPN received: {Query}", rawQuery);

        PaymentVerifyResult verify;
        try
        {
            verify = await vnPay.VerifyCallbackAsync(new PaymentCallback(rawQuery, ip), ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "VNPay verify error");
            return Content("RspCode=99&Message=Unknown error", "text/plain");
        }

        if (!verify.IsValid)
        {
            logger.LogWarning("VNPay HMAC invalid. BookingId:{BookingId}", verify.BookingId);
            return Content("RspCode=97&Message=Invalid checksum", "text/plain");
        }

        await ConfirmPaymentAsync(verify.BookingId, verify.TransactionId, PaymentMethod.VNPay, verify.Amount, ct);

        return Content("RspCode=00&Message=OK", "text/plain");
    }

    // ── MoMo IPN Callback ─────────────────────────────────────────

    /// <summary>
    /// MoMo IPN — POST JSON từ server MoMo.
    /// Serialize body sang query-string để dùng chung VerifyCallbackAsync.
    /// </summary>
    [HttpPost("momo/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> MoMoCallback(
        [FromBody] Dictionary<string, object?> payload, CancellationToken ct)
    {
        var rawQuery = string.Join("&",
            payload.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value?.ToString() ?? "")}"));

        logger.LogInformation("MoMo IPN received: {Payload}", rawQuery);

        PaymentVerifyResult verify;
        try
        {
            verify = await moMo.VerifyCallbackAsync(new PaymentCallback(rawQuery, ""), ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MoMo verify error");
            return Ok(new { message = "Error" });
        }

        if (!verify.IsValid)
        {
            logger.LogWarning("MoMo signature invalid. BookingId:{BookingId}", verify.BookingId);
            return Ok(new { message = "Invalid signature" });
        }

        await ConfirmPaymentAsync(verify.BookingId, verify.TransactionId, PaymentMethod.MoMo, verify.Amount, ct);

        return Ok(new { message = "OK" });
    }

    // ── Shared: xác nhận booking sau khi payment thành công ──────

    private async Task ConfirmPaymentAsync(
        Guid bookingId, string transactionId, PaymentMethod method, decimal amount, CancellationToken ct)
    {
        // Idempotency: đã xử lý rồi thì bỏ qua
        var payment = await uow.Payments.FirstOrDefaultAsync(
            p => p.BookingId == bookingId && p.Status == PaymentStatus.Success, ct);

        if (payment is not null)
        {
            logger.LogInformation("Payment for booking {Id} already confirmed. Skip.", bookingId);
            return;
        }

        // Lấy booking + payment Pending
        var booking = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch).ThenInclude(b => b.Partner)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId, ct);

        if (booking is null)
        {
            logger.LogError("Booking {Id} not found during payment confirm.", bookingId);
            return;
        }

        var pendingPayment = await uow.Payments.FirstOrDefaultAsync(
            p => p.BookingId == bookingId && p.Status == PaymentStatus.Pending && p.Method == method, ct);

        await uow.BeginTransactionAsync(ct);
        try
        {
            // Cập nhật Payment
            if (pendingPayment is not null)
            {
                pendingPayment.Status         = PaymentStatus.Success;
                pendingPayment.TransactionRef = transactionId;
                pendingPayment.PaidAt         = DateTime.UtcNow;
                pendingPayment.GatewayResponse = null; // clear stored URL
                uow.Payments.Update(pendingPayment);
            }
            else
            {
                // Payment tạo từ callback (edge case: payment record bị mất)
                pendingPayment = new Payment
                {
                    BookingId      = bookingId,
                    UserId         = booking.CustomerId,
                    Amount         = amount,
                    Method         = method,
                    Status         = PaymentStatus.Success,
                    TransactionRef = transactionId,
                    PaidAt         = DateTime.UtcNow,
                };
                await uow.Payments.AddAsync(pendingPayment, ct);
            }

            // Cập nhật Booking → Confirmed
            booking.Status = BookingStatus.Confirmed;
            uow.Bookings.Update(booking);

            // Tạo CommissionLedger
            var partner = booking.Court.Branch.Partner;
            var commissionRate = partner?.CommissionRate ?? 0m;
            var commissionAmt  = Math.Round(amount * commissionRate / 100, 2);

            var ledger = new CommissionLedger
            {
                PaymentId      = pendingPayment.PaymentId,
                PartnerId      = booking.Court.Branch.PartnerId,
                GrossAmount    = amount,
                CommissionRate = commissionRate,
                CommissionAmt  = commissionAmt,
                NetAmount      = amount - commissionAmt,
            };
            await uow.CommissionLedger.AddAsync(ledger, ct);

            await uow.SaveChangesAsync(ct);
            await uow.CommitAsync(ct);

            logger.LogInformation("Booking {Id} confirmed. Commission: {Amt}", bookingId, commissionAmt);
        }
        catch (Exception ex)
        {
            await uow.RollbackAsync(ct);
            logger.LogError(ex, "Failed to confirm booking {Id}", bookingId);
            return;
        }

        // Notify customer real-time (ngoài transaction, không block response)
        try
        {
            await hub.SendToUserAsync(booking.CustomerId, "booking.confirmed", new
            {
                bookingId,
                courtName  = booking.Court.Name,
                branchName = booking.Court.Branch.Name,
                date       = booking.BookingDate.ToString("dd/MM/yyyy"),
                time       = $"{booking.StartTime:HH\\:mm}–{booking.EndTime:HH\\:mm}",
                amount,
            }, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "SignalR notify failed for booking {Id}", bookingId);
        }
    }

    // ── Hoàn tiền ────────────────────────────────────────────────

    [HttpPost("{paymentId:guid}/refund")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Refund(
        Guid paymentId, [FromBody] RefundRequest req, CancellationToken ct)
    {
        var payment = await uow.Payments.Query()
            .Include(p => p.Booking)
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId, ct);

        if (payment is null)
            return NotFound(new { error = "Payment không tồn tại." });

        if (payment.Status != PaymentStatus.Success)
            return BadRequest(new { error = "Chỉ có thể hoàn tiền cho payment thành công." });

        payment.Status        = PaymentStatus.Refunded;
        payment.RefundedAt    = DateTime.UtcNow;
        payment.RefundReason  = req.Reason;

        payment.Booking.Status = BookingStatus.Cancelled;
        payment.Booking.CancelReason = $"Refund: {req.Reason}";

        uow.Payments.Update(payment);
        uow.Bookings.Update(payment.Booking);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("Payment {Id} refunded by {User}. Reason: {Reason}",
            paymentId, HttpContext.GetUserId(), req.Reason);

        return Ok(new { paymentId, status = PaymentStatus.Refunded.ToString() });
    }
}

// ── Request / Response records ──────────────────────────────────

public record InitiatePaymentRequest(
    Guid BookingId,
    PaymentMethod Method,
    string ReturnUrl
);

public record RefundRequest(
    string Reason
);
