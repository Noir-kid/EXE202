using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Commands.Payments;
using SportBooking.Application.DTOs.Payment;
using SportBooking.Domain.Enums;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentController(IMediator mediator) : ControllerBase
{
    /// <summary>Create a payment and get redirect URL (VNPay/MoMo) or confirm immediately (Cash).</summary>
    [HttpPost("create")]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest req, CancellationToken ct)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var result = await mediator.Send(
            new CreatePaymentCommand(req.BookingId, req.Method, req.ReturnUrl, clientIp), ct);
        return result.ToActionResult(this);
    }

    /// <summary>
    /// VNPay return URL — browser redirect after payment.
    /// Also serves as IPN if configured as IPN URL.
    /// </summary>
    [HttpGet("vnpay/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> VNPayCallback(CancellationToken ct)
    {
        var parameters = Request.Query.ToDictionary(kv => kv.Key, kv => kv.Value.ToString());
        var result = await mediator.Send(new ProcessCallbackCommand(PaymentMethod.VNPay, parameters), ct);

        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        // VNPay expects "RspCode=00" and "Message=Confirm Success" in IPN response body
        return Ok(new { RspCode = "00", Message = "Confirm Success" });
    }

    /// <summary>MoMo IPN endpoint — called by MoMo server to notify payment result.</summary>
    [HttpPost("momo/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> MoMoCallback([FromBody] Dictionary<string, string> payload, CancellationToken ct)
    {
        var result = await mediator.Send(new ProcessCallbackCommand(PaymentMethod.MoMo, payload), ct);

        if (!result.IsSuccess) return BadRequest(new { error = result.Error });

        // MoMo IPN expects HTTP 204 for acknowledgment
        return NoContent();
    }
}