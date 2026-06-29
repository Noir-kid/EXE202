using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportBooking.API.Extensions;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.DTOs.Revenue;
using SportBooking.Application.Queries.Revenue;

namespace SportBooking.API.Controllers;

[ApiController]
[Route("api/revenue")]
[Authorize]
public class RevenueController(IMediator mediator, ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Platform-wide revenue — Admin only.</summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminRevenue(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAdminRevenueQuery(new RevenueQueryFilter(from, to)), ct);
        return result.ToActionResult(this);
    }

    /// <summary>Revenue for a specific owner — Admin or the owner themselves.</summary>
    [HttpGet("owner")]
    [Authorize(Roles = "Admin,Owner")]
    public async Task<IActionResult> GetOwnerRevenue(
        [FromQuery] Guid? ownerId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        // Owner can only query their own revenue; Admin can query any
        var targetOwnerId = currentUser.IsOwner
            ? currentUser.OwnerId!.Value
            : ownerId ?? Guid.Empty;

        if (targetOwnerId == Guid.Empty)
            return BadRequest(new { error = "ownerId is required for Admin role." });

        var result = await mediator.Send(
            new GetOwnerRevenueQuery(targetOwnerId, new RevenueQueryFilter(from, to)), ct);
        return result.ToActionResult(this);
    }
}