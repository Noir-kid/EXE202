using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Commands.Bookings;
using SportBooking.Application.DTOs.Booking;
using SportBooking.Application.Queries.Bookings;
using SportBooking.Domain.Enums;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingController(IMediator mediator, IMapper mapper) : ControllerBase
{
    /// <summary>Create a new booking (Customer only).</summary>
    [HttpPost]
    [Authorize(Roles = "Customer")]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest req, CancellationToken ct)
    {
        var cmd = mapper.Map<CreateBookingCommand>(req);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    /// <summary>List bookings — filtered by role (Customer=own, Owner=own owner, Admin=all).</summary>
    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] Guid? courtId,
        [FromQuery] Guid? branchId,
        [FromQuery] BookingStatus? status,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetBookingsQuery(courtId, branchId, status, from, to, page, pageSize), ct);
        return result.ToActionResult(this);
    }

    /// <summary>Check time slot availability for a court on a specific date.</summary>
    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckAvailability(
        [FromQuery] Guid courtId,
        [FromQuery] DateOnly date,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new CheckAvailabilityQuery(courtId, date), ct);
        return result.ToActionResult(this);
    }

    /// <summary>Cancel a booking.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelBookingRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelBookingCommand(id, req.Reason), ct);
        return result.ToActionResult(this);
    }
}