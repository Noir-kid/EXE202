using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Application.DTOs.Booking;
using SportSG.Application.Services;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingController(IBookingService bookingService) : ControllerBase
{
    /// <summary>
    /// Customer self-booking.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.Customer}")]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req, CancellationToken ct)
    {
        var result = await bookingService.CreateAsync(HttpContext.GetUserId(), req, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.BookingId }, result);
    }

    /// <summary>
    /// Staff walk-in booking on behalf of customer.
    /// </summary>
    [HttpPost("walk-in")]
    [Authorize(Roles = $"{Roles.Staff},{Roles.BranchManager},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> WalkIn([FromBody] CreateBookingRequest req, CancellationToken ct)
    {
        var result = await bookingService.CreateWalkInAsync(HttpContext.GetUserId(), req, ct);
        return CreatedAtAction(nameof(GetById), new { id = result.BookingId }, result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await bookingService.GetByIdAsync(id, HttpContext.GetUserId(), HttpContext.GetRole(), ct);
        return Ok(result);
    }

    /// <summary>
    /// Paged booking list — scope automatically enforced by role.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] BookingFilterRequest filter, CancellationToken ct)
    {
        var result = await bookingService.ListAsync(
            filter,
            HttpContext.GetUserId(),
            HttpContext.GetRole(),
            HttpContext.GetPartnerId(),
            HttpContext.GetBranchId(),
            ct);
        return Ok(result);
    }

    /// <summary>
    /// Update booking status (Confirm / CheckIn / CheckOut / Cancel).
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager},{Roles.Staff},{Roles.Customer}")]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateBookingStatusRequest req, CancellationToken ct)
    {
        await bookingService.UpdateStatusAsync(
            req with { BookingId = id },
            HttpContext.GetUserId(),
            HttpContext.GetRole(),
            ct);
        return NoContent();
    }

    /// <summary>
    /// Available hourly slots for a court on a date.
    /// </summary>
    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<IActionResult> Availability([FromQuery] Guid courtId, [FromQuery] DateOnly date, CancellationToken ct)
    {
        var slots = await bookingService.GetAvailableSlotsAsync(courtId, date, ct);
        return Ok(slots);
    }
}
