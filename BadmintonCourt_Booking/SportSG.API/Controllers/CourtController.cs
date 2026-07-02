using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Authorization;
using SportSG.API.Extensions;
using SportSG.API.Middleware;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/courts")]
public class CourtController(IUnitOfWork uow, ILogger<CourtController> logger) : ControllerBase
{
    // ── Public: search active courts ─────────────────────────────────────

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

        var items = await q
            .OrderBy(c => c.BasePrice)
            .Select(c => new {
                c.CourtId, c.Name, c.Description, c.BasePrice,
                ImageUrl   = c.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                             ?? c.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                c.Status, c.SportTypeId, c.BranchId,
                SportName  = c.SportType.Name,
                BranchName = c.Branch.Name,
                BranchCity = c.Branch.City,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    // ── Management view (scoped by role) ────────────────────────────────

    /// <summary>
    /// SuperAdmin: tất cả courts.
    /// PartnerAdmin: courts thuộc branches của partner mình — không cần truyền PartnerId.
    /// BranchManager / Staff: courts trong branch của mình.
    /// </summary>
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
            .Include(c => c.Facilities)
            .AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(c => c.Branch.PartnerId == partnerId),
            Roles.BranchManager => q.Where(c => c.BranchId == branchId),
            Roles.Staff         => q.Where(c => c.BranchId == branchId),
            _                   => q.Where(c => c.Status == CourtStatus.Active),
        };

        var items = await q
            .OrderBy(c => c.Branch.Name).ThenBy(c => c.Name)
            .Select(c => new {
                c.CourtId, c.Name, c.Description, c.BasePrice, c.Status, c.Capacity,
                c.SportTypeId, c.BranchId,
                SportName  = c.SportType.Name,
                BranchName = c.Branch.Name,
                PartnerId  = c.Branch.PartnerId,
                ImageUrl   = c.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                             ?? c.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                Facilities = c.Facilities.Select(f => new { f.CourtFacilityId, f.Name, f.Icon }),
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    // ── Public: court detail ─────────────────────────────────────────────

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
            PartnerId    = court.Branch.PartnerId,
            PartnerName  = court.Branch.Partner.Name,
            Images       = court.Images.Select(i => new { i.CourtImageId, i.Url, i.IsPrimary, i.SortOrder }),
            Facilities   = court.Facilities.Select(f => new { f.CourtFacilityId, f.Name, f.Icon }),
            PricingRules = court.PricingRules.Select(r => new { r.RuleId, r.DayOfWeek, r.StartTime, r.EndTime, r.Price, r.Label }),
            Reviews      = court.Reviews.Select(r => new { r.ReviewId, r.Rating, r.Comment, r.CreatedAt }),
        });
    }

    // ── Create ───────────────────────────────────────────────────────────

    /// <summary>
    /// Xác thực chain: Court → Branch → Partner.
    /// PartnerAdmin không thể tạo court trong branch của partner khác.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateCourtRequest req, CancellationToken ct)
    {
        if (req.BasePrice <= 0)
            return BadRequest(new { error = "BasePrice phải lớn hơn 0." });

        // Kiểm tra branch tồn tại và quyền truy cập (chain: branch → partner)
        await TenantGuard.RequireBranchOwnershipAsync(HttpContext, req.BranchId, uow, ct);

        // Validate tên court không trùng trong cùng branch
        if (await uow.Courts.AnyAsync(c => c.BranchId == req.BranchId
                && c.Name.ToLower() == req.Name.ToLower(), ct))
            throw new ConflictException($"Sân '{req.Name}' đã tồn tại trong chi nhánh này.");

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

        logger.LogInformation("User {UserId} created court '{Name}' in branch {BranchId}",
            HttpContext.GetUserId(), court.Name, req.BranchId);

        return CreatedAtAction(nameof(GetById), new { id = court.CourtId },
            new { court.CourtId, court.Name, court.BranchId });
    }

    // ── Update ───────────────────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCourtRequest req, CancellationToken ct)
    {
        if (req.BasePrice <= 0)
            return BadRequest(new { error = "BasePrice phải lớn hơn 0." });

        // TenantGuard xác thực chain court → branch → partner
        var court = await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        // Validate tên không trùng trong cùng branch (bỏ qua chính nó)
        if (await uow.Courts.AnyAsync(c => c.BranchId == court.BranchId
                && c.CourtId != id
                && c.Name.ToLower() == req.Name.ToLower(), ct))
            throw new ConflictException($"Sân '{req.Name}' đã tồn tại trong chi nhánh này.");

        court.Name        = req.Name;
        court.Description = req.Description;
        court.BasePrice   = req.BasePrice;
        court.Capacity    = req.Capacity;
        court.Status      = req.Status;
        court.UpdatedAt   = DateTime.UtcNow;

        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} updated court {CourtId}",
            HttpContext.GetUserId(), id);

        return NoContent();
    }

    // ── Delete ───────────────────────────────────────────────────────────

    /// <summary>
    /// Soft-delete: chuyển Status → Inactive.
    /// Không xóa hẳn để giữ lịch sử booking.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var court = await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        // BranchManager chỉ có thể xóa court của branch mình
        if (HttpContext.GetRole() == Roles.BranchManager && court.BranchId != HttpContext.GetBranchId())
            throw new ForbiddenException("Bạn chỉ có thể xóa sân trong chi nhánh của mình.");

        var hasActiveBookings = await uow.Bookings.AnyAsync(
            b => b.CourtId == id
              && (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed), ct);

        if (hasActiveBookings)
            throw new BusinessException(
                "Không thể xóa sân đang có booking Pending/Confirmed. Hủy các booking trước.");

        court.Status    = CourtStatus.Inactive;
        court.UpdatedAt = DateTime.UtcNow;

        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} deleted (inactivated) court {CourtId} '{Name}'",
            HttpContext.GetUserId(), id, court.Name);

        return NoContent();
    }

    // ── Status toggle ────────────────────────────────────────────────────

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager},{Roles.Staff}")]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetCourtStatusRequest req, CancellationToken ct)
    {
        var court = await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        court.Status    = req.Status;
        court.UpdatedAt = DateTime.UtcNow;

        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Images ───────────────────────────────────────────────────────────

    [HttpPost("{id:guid}/images")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> AddImage(Guid id, [FromBody] AddCourtImageRequest req, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        if (req.IsPrimary)
        {
            var existingPrimaries = await uow.CourtImages.FindAsync(i => i.CourtId == id && i.IsPrimary, ct);
            foreach (var img in existingPrimaries)
            {
                img.IsPrimary = false;
                uow.CourtImages.Update(img);
            }
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

    [HttpDelete("{id:guid}/images/{imageId:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> RemoveImage(Guid id, int imageId, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        var image = await uow.CourtImages.FirstOrDefaultAsync(
            i => i.CourtImageId == imageId && i.CourtId == id, ct)
            ?? throw new NotFoundException($"Ảnh {imageId} không tồn tại.");

        uow.CourtImages.Remove(image);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Facilities ───────────────────────────────────────────────────────

    [HttpPost("{id:guid}/facilities")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> AddFacility(Guid id, [FromBody] AddCourtFacilityRequest req, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        var facility = new CourtFacility
        {
            CourtId = id,
            Name    = req.Name,
            Icon    = req.Icon,
        };

        await uow.CourtFacilities.AddAsync(facility, ct);
        await uow.SaveChangesAsync(ct);

        return Ok(new { facility.CourtFacilityId, facility.Name, facility.Icon });
    }

    [HttpDelete("{id:guid}/facilities/{facilityId:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> RemoveFacility(Guid id, int facilityId, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        var facility = await uow.CourtFacilities.FirstOrDefaultAsync(
            f => f.CourtFacilityId == facilityId && f.CourtId == id, ct)
            ?? throw new NotFoundException($"Tiện ích {facilityId} không tồn tại.");

        uow.CourtFacilities.Remove(facility);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    // ── Pricing rules ────────────────────────────────────────────────────

    [HttpGet("{id:guid}/pricing-rules")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> GetPricingRules(Guid id, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        var rules = await uow.CourtPricingRules.Query()
            .Where(r => r.CourtId == id)
            .OrderBy(r => r.DayOfWeek).ThenBy(r => r.StartTime)
            .Select(r => new { r.RuleId, r.DayOfWeek, r.StartTime, r.EndTime, r.Price, r.Label, r.IsActive })
            .ToListAsync(ct);

        return Ok(rules);
    }

    [HttpPost("{id:guid}/pricing-rules")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> AddPricingRule(Guid id, [FromBody] UpsertPricingRuleRequest req, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        if (req.Price <= 0) return BadRequest(new { error = "Giá phải lớn hơn 0." });
        if (req.StartTime >= req.EndTime) return BadRequest(new { error = "Giờ bắt đầu phải trước giờ kết thúc." });

        var rule = new CourtPricingRule
        {
            CourtId   = id,
            DayOfWeek = req.DayOfWeek,
            StartTime = req.StartTime,
            EndTime   = req.EndTime,
            Price     = req.Price,
            Label     = req.Label,
            IsActive  = req.IsActive,
        };

        await uow.CourtPricingRules.AddAsync(rule, ct);
        await uow.SaveChangesAsync(ct);

        return Ok(new { rule.RuleId, rule.DayOfWeek, rule.StartTime, rule.EndTime, rule.Price, rule.Label, rule.IsActive });
    }

    [HttpPut("{id:guid}/pricing-rules/{ruleId:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> UpdatePricingRule(Guid id, int ruleId, [FromBody] UpsertPricingRuleRequest req, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        if (req.Price <= 0) return BadRequest(new { error = "Giá phải lớn hơn 0." });
        if (req.StartTime >= req.EndTime) return BadRequest(new { error = "Giờ bắt đầu phải trước giờ kết thúc." });

        var rule = await uow.CourtPricingRules.FirstOrDefaultAsync(
            r => r.RuleId == ruleId && r.CourtId == id, ct)
            ?? throw new NotFoundException($"Quy tắc giá {ruleId} không tồn tại.");

        rule.DayOfWeek = req.DayOfWeek;
        rule.StartTime = req.StartTime;
        rule.EndTime   = req.EndTime;
        rule.Price     = req.Price;
        rule.Label     = req.Label;
        rule.IsActive  = req.IsActive;

        uow.CourtPricingRules.Update(rule);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("{id:guid}/pricing-rules/{ruleId:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> DeletePricingRule(Guid id, int ruleId, CancellationToken ct)
    {
        await TenantGuard.RequireCourtAccessAsync(HttpContext, id, uow, ct);

        var rule = await uow.CourtPricingRules.FirstOrDefaultAsync(
            r => r.RuleId == ruleId && r.CourtId == id, ct)
            ?? throw new NotFoundException($"Quy tắc giá {ruleId} không tồn tại.");

        uow.CourtPricingRules.Remove(rule);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }
}

// ── Request Records ──────────────────────────────────────────────────────────

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

public record AddCourtFacilityRequest(
    string Name,
    string? Icon
);

public record UpsertPricingRuleRequest(
    int? DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    decimal Price,
    string? Label,
    bool IsActive = true
);
