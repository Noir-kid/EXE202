using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Commands.Branches;
using SportBooking.Application.DTOs.Branch;
using SportBooking.Application.Queries.Branches;
using SportBooking.Domain.Enums;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/branches")]
public class BranchController(IMediator mediator, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] Guid? ownerId,
        [FromQuery] BranchStatus? status,
        [FromQuery] string? city,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetBranchesQuery(new BranchListQuery(ownerId, status, city, page, pageSize)), ct);
        return result.ToActionResult(this);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetBranchByIdQuery(id), ct);
        return result.ToActionResult(this);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest req, CancellationToken ct)
    {
        var cmd = mapper.Map<CreateBranchCommand>(req);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Owner,Staff")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchRequest req, CancellationToken ct)
    {
        var cmd = new UpdateBranchCommand(id, req.Name, req.Address, req.City, req.District,
            req.Phone, req.Description, req.ImageUrl, req.OpenTime, req.CloseTime, req.Status);
        var result = await mediator.Send(cmd, ct);
        return result.ToActionResult(this);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteBranchCommand(id), ct);
        return result.ToActionResult(this);
    }
}