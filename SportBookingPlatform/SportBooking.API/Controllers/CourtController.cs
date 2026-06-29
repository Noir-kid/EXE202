using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Commands.Courts;
using SportBooking.Application.DTOs.Court;
using SportBooking.Application.Queries.Courts;
using SportBooking.Domain.Enums;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/courts")]
public class CourtController(IMediator mediator, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] Guid? branchId,
        [FromQuery] Guid? ownerId,
        [FromQuery] SportType? sportType,
        [FromQuery] CourtStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetCourtsQuery(new CourtListQuery(branchId, ownerId, sportType, status, page, pageSize)), ct);
        return result.ToActionResult(this);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetCourtByIdQuery(id), ct);
        return result.ToActionResult(this);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Create([FromBody] CreateCourtRequest req, CancellationToken ct)
    {
        var cmd = mapper.Map<CreateCourtCommand>(req);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Owner,Staff")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourtRequest req, CancellationToken ct)
    {
        var cmd = new UpdateCourtCommand(id, req.Name, req.PricePerHour, req.Description,
            req.ImageUrl, req.Status, req.PeakHourMultiplier, req.PeakHourStart, req.PeakHourEnd);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteCourtCommand(id), ct);
        return result.ToActionResult(this);
    }
}