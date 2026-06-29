using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/branches")]
public class BranchController(IUnitOfWork uow) : ControllerBase
{
    /// <summary>Public: search branches by city / sport type.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] string? city,
        [FromQuery] int? sportTypeId,
        CancellationToken ct)
    {
        var q = uow.Branches.Query()
            .Where(b => b.Status == BranchStatus.Active);

        if (!string.IsNullOrEmpty(city))
            q = q.Where(b => b.City!.Contains(city));

        if (sportTypeId.HasValue)
            q = q.Where(b => b.BranchSportTypes.Any(bs => bs.SportTypeId == sportTypeId.Value));

        var items = await q
            .Select(b => new {
                b.BranchId, b.Name, b.Address, b.City, b.Phone,
                b.ImageUrl, b.MapUrl, b.Latitude, b.Longitude,
                SportTypes = b.BranchSportTypes.Select(bs => bs.SportType.Name)
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var branch = await uow.Branches.Query()
            .Include(b => b.Partner)
            .Include(b => b.BranchSportTypes).ThenInclude(bs => bs.SportType)
            .Include(b => b.Courts)
            .FirstOrDefaultAsync(b => b.BranchId == id, ct);

        return branch is null ? NotFound() : Ok(branch);
    }

    /// <summary>Authenticated management view — all branches scoped by role.</summary>
    [HttpGet("manage")]
    [Authorize]
    public async Task<IActionResult> Manage(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Branches.Query().AsQueryable();
        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(b => b.PartnerId == partnerId),
            Roles.BranchManager => q.Where(b => b.BranchId == branchId),
            Roles.Staff         => q.Where(b => b.BranchId == branchId),
            _                   => q.Where(b => b.Status == BranchStatus.Active),
        };

        var items = await q.Select(b => new {
            b.BranchId, b.Name, b.Address, b.City, b.District, b.Phone,
            b.Email, b.ImageUrl, b.OpenTime, b.CloseTime, b.MapUrl,
            b.Status, b.PartnerId,
        }).ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>PartnerAdmin / SuperAdmin can add branches.</summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest req, CancellationToken ct)
    {
        var partnerId = HttpContext.GetRole() == Roles.PartnerAdmin
            ? HttpContext.GetPartnerId()!.Value
            : req.PartnerId;

        var branch = new Branch
        {
            PartnerId = partnerId,
            Name      = req.Name,
            Address   = req.Address,
            City      = req.City,
            District  = req.District,
            Phone     = req.Phone,
            Email     = req.Email,
            MapUrl    = req.MapUrl,
            OpenTime  = req.OpenTime,
            CloseTime = req.CloseTime,
        };
        await uow.Branches.AddAsync(branch, ct);
        await uow.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = branch.BranchId }, new { branch.BranchId });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchRequest req, CancellationToken ct)
    {
        var branch = await uow.Branches.GetByIdAsync(id, ct);
        if (branch is null) return NotFound();

        // PartnerAdmin can only update own partner's branches
        var callerRole = HttpContext.GetRole();
        if (callerRole == Roles.PartnerAdmin && branch.PartnerId != HttpContext.GetPartnerId())
            return Forbid();

        // BranchManager can only update their branch
        if (callerRole == Roles.BranchManager && id != HttpContext.GetBranchId())
            return Forbid();

        branch.Name      = req.Name;
        branch.Address   = req.Address;
        branch.Phone     = req.Phone;
        branch.Status    = req.Status;
        branch.OpenTime  = req.OpenTime;
        branch.CloseTime = req.CloseTime;
        branch.UpdatedAt = DateTime.UtcNow;

        uow.Branches.Update(branch);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateBranchRequest(
    Guid PartnerId,          // ignored if caller is PartnerAdmin
    string Name,
    string? Address,
    string? City,
    string? District,
    string? Phone,
    string? Email,
    string? MapUrl,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime
);

public record UpdateBranchRequest(
    string Name,
    string? Address,
    string? Phone,
    BranchStatus Status,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime
);
