using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/courts")]
public class CourtController(IUnitOfWork uow) : ControllerBase
{
    /// <summary>Public search — customers find courts.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Search(
        [FromQuery] Guid? branchId,
        [FromQuery] int? sportTypeId,
        [FromQuery] decimal? maxPrice,
        CancellationToken ct)
    {
        var q = uow.Courts.Query()
            .Include(c => c.Branch)
            .Include(c => c.SportType)
            .Include(c => c.Images)
            .Where(c => c.Status == CourtStatus.Active && c.Branch.Status == BranchStatus.Active);

        if (branchId.HasValue)    q = q.Where(c => c.BranchId == branchId);
        if (sportTypeId.HasValue) q = q.Where(c => c.SportTypeId == sportTypeId);
        if (maxPrice.HasValue)    q = q.Where(c => c.BasePrice <= maxPrice);

        var items = await q.Select(c => new {
            c.CourtId, c.Name, c.Description, c.BasePrice,
            ImageUrl   = c.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                         ?? c.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            c.Status, c.SportTypeId,
            SportName  = c.SportType.Name,
            BranchName = c.Branch.Name,
            BranchCity = c.Branch.City,
        }).ToListAsync(ct);

        return Ok(items);
    }

    /// <summary>Authenticated management view — all courts scoped by role.</summary>
    [HttpGet("manage")]
    [Authorize]
    public async Task<IActionResult> Manage(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Courts.Query()
            .Include(c => c.Branch)
            .Include(c => c.SportType)
            .Include(c => c.Images)
            .AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(c => c.Branch.PartnerId == partnerId),
            Roles.BranchManager => q.Where(c => c.BranchId == branchId),
            Roles.Staff         => q.Where(c => c.BranchId == branchId),
            _                   => q.Where(c => c.Status == CourtStatus.Active),
        };

        var items = await q.Select(c => new {
            c.CourtId, c.Name, c.Description, c.BasePrice,
            ImageUrl   = c.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                         ?? c.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
            c.Status, c.SportTypeId, c.BranchId,
            SportName  = c.SportType.Name,
            BranchName = c.Branch.Name,
        }).ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch).ThenInclude(b => b.Partner)
            .Include(c => c.SportType)
            .Include(c => c.CourtType)
            .Include(c => c.Images.OrderBy(i => i.SortOrder))
            .Include(c => c.Facilities)
            .Include(c => c.PricingRules.Where(r => r.IsActive))
            .Include(c => c.Reviews.Where(r => r.IsVisible).OrderByDescending(r => r.CreatedAt).Take(10))
            .FirstOrDefaultAsync(c => c.CourtId == id, ct);

        if (court is null) return NotFound();

        return Ok(new {
            court.CourtId, court.Name, court.Description, court.BasePrice,
            court.Status, court.Capacity, court.SportTypeId,
            SportName    = court.SportType.Name,
            CourtType    = court.CourtType?.Name,
            BranchId     = court.BranchId,
            BranchName   = court.Branch.Name,
            BranchAddress= court.Branch.Address,
            PartnerName  = court.Branch.Partner.Name,
            Images       = court.Images.Select(i => new { i.CourtImageId, i.Url, i.IsPrimary, i.SortOrder }),
            Facilities   = court.Facilities.Select(f => new { f.CourtFacilityId, f.Name }),
            PricingRules = court.PricingRules,
            Reviews      = court.Reviews.Select(r => new { r.ReviewId, r.Rating, r.Comment, r.CreatedAt }),
        });
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateCourtRequest req, CancellationToken ct)
    {
        var branch = await uow.Branches.GetByIdAsync(req.BranchId, ct);
        if (branch is null) return NotFound("Chi nhánh không tồn tại.");

        if (HttpContext.GetRole() == Roles.PartnerAdmin
            && branch.PartnerId != HttpContext.GetPartnerId())
            return Forbid();

        var court = new Court
        {
            BranchId    = req.BranchId,
            SportTypeId = req.SportTypeId,
            CourtTypeId = req.CourtTypeId,
            Name        = req.Name,
            Description = req.Description,
            BasePrice   = req.BasePrice,
            Capacity    = req.Capacity,
        };

        await uow.Courts.AddAsync(court, ct);
        await uow.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = court.CourtId }, new { court.CourtId });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourtRequest req, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch)
            .FirstOrDefaultAsync(c => c.CourtId == id, ct);
        if (court is null) return NotFound();

        var role = HttpContext.GetRole();
        if (role == Roles.PartnerAdmin && court.Branch.PartnerId != HttpContext.GetPartnerId())
            return Forbid();
        if (role == Roles.BranchManager && court.BranchId != HttpContext.GetBranchId())
            return Forbid();

        court.Name        = req.Name;
        court.Description = req.Description;
        court.BasePrice   = req.BasePrice;
        court.Capacity    = req.Capacity;
        court.Status      = req.Status;
        court.UpdatedAt   = DateTime.UtcNow;

        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Staff can toggle court status (Active ↔ Maintenance).</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager},{Roles.Staff}")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetCourtStatusRequest req, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch)
            .FirstOrDefaultAsync(c => c.CourtId == id, ct);
        if (court is null) return NotFound();

        var role = HttpContext.GetRole();
        if (role is Roles.Staff or Roles.BranchManager && court.BranchId != HttpContext.GetBranchId())
            return Forbid();

        court.Status    = req.Status;
        court.UpdatedAt = DateTime.UtcNow;
        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>Add an image to a court (after upload via /api/upload).</summary>
    [HttpPost("{id:guid}/images")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> AddImage(Guid id, [FromBody] AddCourtImageRequest req, CancellationToken ct)
    {
        var court = await uow.Courts.GetByIdAsync(id, ct);
        if (court is null) return NotFound();

        // If this is set as primary, clear other primaries
        if (req.IsPrimary)
        {
            var existingImages = await uow.CourtImages.FindAsync(i => i.CourtId == id && i.IsPrimary, ct);
            foreach (var img in existingImages) { img.IsPrimary = false; uow.CourtImages.Update(img); }
        }

        var image = new CourtImage
        {
            CourtId   = id,
            Url       = req.Url,
            PublicId  = req.PublicId,
            IsPrimary = req.IsPrimary,
            SortOrder = req.SortOrder,
        };
        await uow.CourtImages.AddAsync(image, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(new { image.CourtImageId, image.Url, image.IsPrimary });
    }

    /// <summary>Remove a court image.</summary>
    [HttpDelete("{id:guid}/images/{imageId:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> RemoveImage(Guid id, int imageId, CancellationToken ct)
    {
        var image = await uow.CourtImages.FirstOrDefaultAsync(i => i.CourtImageId == imageId && i.CourtId == id, ct);
        if (image is null) return NotFound();
        uow.CourtImages.Remove(image);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record CreateCourtRequest(
    Guid BranchId,
    int SportTypeId,
    int? CourtTypeId,
    string Name,
    string? Description,
    decimal BasePrice,
    int? Capacity
);

public record UpdateCourtRequest(
    string Name,
    string? Description,
    decimal BasePrice,
    int? Capacity,
    CourtStatus Status
);

public record SetCourtStatusRequest(CourtStatus Status);

public record AddCourtImageRequest(
    string Url,
    string? PublicId,
    bool IsPrimary = false,
    int SortOrder = 0
);
