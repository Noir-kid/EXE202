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
[Route("api/branches")]
public class BranchController(IUnitOfWork uow, ILogger<BranchController> logger) : ControllerBase
{
    // ── Public: search active branches ──────────────────────────────────

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
            .OrderBy(b => b.Name)
            .Select(b => new {
                b.BranchId, b.Name, b.Address, b.City, b.Phone,
                b.ImageUrl, b.MapUrl, b.Latitude, b.Longitude,
                SportTypes = b.BranchSportTypes.Select(bs => bs.SportType.Name)
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    // ── Public: get branch detail ────────────────────────────────────────

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var branch = await uow.Branches.Query()
            .Include(b => b.Partner)
            .Include(b => b.BranchSportTypes).ThenInclude(bs => bs.SportType)
            .Include(b => b.Courts.Where(c => c.Status == CourtStatus.Active))
            .FirstOrDefaultAsync(b => b.BranchId == id, ct);

        if (branch is null) return NotFound();

        return Ok(new {
            branch.BranchId, branch.Name, branch.Address,
            branch.City, branch.District, branch.Phone, branch.Email,
            branch.ImageUrl, branch.MapUrl, branch.Latitude, branch.Longitude,
            branch.OpenTime, branch.CloseTime, branch.Status,
            PartnerName = branch.Partner.Name,
            SportTypes  = branch.BranchSportTypes.Select(bs => bs.SportType.Name),
            Courts      = branch.Courts.Select(c => new { c.CourtId, c.Name, c.BasePrice })
        });
    }

    // ── Management view (scoped by role) ────────────────────────────────

    /// <summary>
    /// SuperAdmin: tất cả branches.
    /// PartnerAdmin: chỉ branches thuộc partner của mình — không cần client truyền PartnerId.
    /// BranchManager / Staff: chỉ branch của mình.
    /// </summary>
    [HttpGet("manage")]
    [Authorize]
    public async Task<IActionResult> Manage(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Branches.Query().Include(b => b.Partner).AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(b => b.PartnerId == partnerId),
            Roles.BranchManager => q.Where(b => b.BranchId == branchId),
            Roles.Staff         => q.Where(b => b.BranchId == branchId),
            _                   => q.Where(b => b.Status == BranchStatus.Active),
        };

        var items = await q
            .OrderBy(b => b.Name)
            .Select(b => new {
                b.BranchId, b.Name, b.Address, b.City, b.District, b.Phone,
                b.Email, b.ImageUrl, b.OpenTime, b.CloseTime, b.MapUrl,
                b.Status, b.PartnerId,
                PartnerName = b.Partner.Name,
                CourtCount  = b.Courts.Count(c => c.Status != CourtStatus.Inactive),
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    // ── Create ───────────────────────────────────────────────────────────

    /// <summary>
    /// SuperAdmin: tạo branch cho bất kỳ partner nào (truyền PartnerId trong body).
    /// PartnerAdmin: tạo branch cho partner của mình (PartnerId trong body bị bỏ qua, dùng từ JWT).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest req, CancellationToken ct)
    {
        if (req.OpenTime.HasValue && req.CloseTime.HasValue && req.CloseTime <= req.OpenTime)
            return BadRequest(new { error = "Giờ đóng cửa phải sau giờ mở cửa." });

        // Resolve target partnerId
        var callerRole = HttpContext.GetRole();
        Guid partnerId;

        if (callerRole == Roles.SuperAdmin)
        {
            if (req.PartnerId == Guid.Empty)
                return BadRequest(new { error = "SuperAdmin phải cung cấp PartnerId." });

            var partner = await uow.Partners.GetByIdAsync(req.PartnerId, ct)
                ?? throw new NotFoundException($"Partner {req.PartnerId} không tồn tại.");

            if (partner.Status != PartnerStatus.Active)
                throw new BusinessException("Chỉ có thể tạo Branch cho Partner đang Active.");

            partnerId = req.PartnerId;
        }
        else
        {
            // PartnerAdmin — lấy partnerId từ JWT
            partnerId = HttpContext.GetPartnerId()
                ?? throw new BusinessException("Không xác định được Partner của bạn.");
        }

        // Validate: tên branch không trùng trong cùng partner
        if (await uow.Branches.AnyAsync(b => b.PartnerId == partnerId
                && b.Name.ToLower() == req.Name.ToLower(), ct))
            throw new ConflictException($"Chi nhánh '{req.Name}' đã tồn tại trong partner này.");

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
            ImageUrl  = req.ImageUrl,
            OpenTime  = req.OpenTime,
            CloseTime = req.CloseTime,
        };

        await uow.Branches.AddAsync(branch, ct);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} created branch '{Name}' for partner {PartnerId}",
            HttpContext.GetUserId(), branch.Name, partnerId);

        return CreatedAtAction(nameof(GetById), new { id = branch.BranchId },
            new { branch.BranchId, branch.Name, branch.PartnerId });
    }

    // ── Update ───────────────────────────────────────────────────────────

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBranchRequest req, CancellationToken ct)
    {
        if (req.OpenTime.HasValue && req.CloseTime.HasValue && req.CloseTime <= req.OpenTime)
            return BadRequest(new { error = "Giờ đóng cửa phải sau giờ mở cửa." });

        var branch = await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, id, uow, ct);

        // Validate tên không trùng trong cùng partner (bỏ qua chính nó)
        if (await uow.Branches.AnyAsync(b => b.PartnerId == branch.PartnerId
                && b.BranchId != id
                && b.Name.ToLower() == req.Name.ToLower(), ct))
            throw new ConflictException($"Tên chi nhánh '{req.Name}' đã tồn tại trong partner này.");

        branch.Name      = req.Name;
        branch.Address   = req.Address;
        branch.Phone     = req.Phone;
        branch.Email     = req.Email;
        branch.Status    = req.Status;
        branch.OpenTime  = req.OpenTime;
        branch.CloseTime = req.CloseTime;
        if (req.ImageUrl is not null) branch.ImageUrl = req.ImageUrl;
        branch.UpdatedAt = DateTime.UtcNow;

        uow.Branches.Update(branch);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} updated branch {BranchId}",
            HttpContext.GetUserId(), id);

        return NoContent();
    }

    // ── Delete ───────────────────────────────────────────────────────────

    /// <summary>
    /// Soft-delete: chuyển Status → Closed.
    /// Không xóa hẳn để giữ lịch sử booking.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var branch = await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, id, uow, ct);

        // Kiểm tra có booking Pending/Confirmed không
        var hasActiveBookings = await uow.Bookings.AnyAsync(
            b => b.Court.BranchId == id
              && (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed), ct);

        if (hasActiveBookings)
            throw new BusinessException(
                "Không thể xóa chi nhánh đang có booking Pending/Confirmed. Hủy các booking trước.");

        branch.Status    = BranchStatus.Closed;
        branch.UpdatedAt = DateTime.UtcNow;

        uow.Branches.Update(branch);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} deleted (closed) branch {BranchId} '{Name}'",
            HttpContext.GetUserId(), id, branch.Name);

        return NoContent();
    }
}

// ── Request Records ──────────────────────────────────────────────────────────

public record CreateBranchRequest(
    Guid PartnerId,           // required for SuperAdmin; ignored for PartnerAdmin
    string Name,
    string? Address,
    string? City,
    string? District,
    string? Phone,
    string? Email,
    string? MapUrl,
    string? ImageUrl,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime
);

public record UpdateBranchRequest(
    string Name,
    string? Address,
    string? Phone,
    string? Email,
    BranchStatus Status,
    string? ImageUrl,
    TimeOnly? OpenTime,
    TimeOnly? CloseTime
);
