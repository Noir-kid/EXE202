using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Authorization;
using SportSG.API.Extensions;
using SportSG.API.Middleware;
using SportSG.Application.Repositories;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/holidays")]
[Authorize]
public class HolidayController(IUnitOfWork uow, ILogger<HolidayController> logger) : ControllerBase
{
    /// <summary>
    /// SuperAdmin: tất cả (kể cả toàn hệ thống).
    /// PartnerAdmin: toàn hệ thống + các chi nhánh của partner mình.
    /// BranchManager / Staff: toàn hệ thống + chi nhánh của mình.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? branchId, CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var myBranchId = HttpContext.GetBranchId();

        var q = uow.Holidays.Query().Include(h => h.Branch).AsQueryable();

        if (branchId.HasValue)
        {
            await TenantGuard.RequireBranchAccessAsync(HttpContext, branchId.Value, uow, ct);
            q = q.Where(h => h.BranchId == branchId || h.BranchId == null);
        }
        else
        {
            q = role switch
            {
                Roles.SuperAdmin    => q,
                Roles.PartnerAdmin  => q.Where(h => h.BranchId == null || h.Branch!.PartnerId == partnerId),
                Roles.BranchManager => q.Where(h => h.BranchId == null || h.BranchId == myBranchId),
                Roles.Staff         => q.Where(h => h.BranchId == null || h.BranchId == myBranchId),
                _                   => q.Where(h => h.BranchId == null),
            };
        }

        var items = await q
            .OrderBy(h => h.Date)
            .Select(h => new {
                h.HolidayId, h.BranchId, h.Date, h.Reason, h.IsRecurringYearly,
                BranchName = h.Branch != null ? h.Branch.Name : null,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Create([FromBody] UpsertHolidayRequest req, CancellationToken ct)
    {
        if (req.BranchId.HasValue)
            await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, req.BranchId.Value, uow, ct);
        else if (HttpContext.GetRole() != Roles.SuperAdmin)
            throw new ForbiddenException("Chỉ SuperAdmin mới có thể tạo ngày nghỉ áp dụng toàn hệ thống.");

        var holiday = new Holiday
        {
            BranchId          = req.BranchId,
            Date              = req.Date,
            Reason            = req.Reason,
            IsRecurringYearly = req.IsRecurringYearly,
        };

        await uow.Holidays.AddAsync(holiday, ct);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} created holiday {HolidayId} on {Date}",
            HttpContext.GetUserId(), holiday.HolidayId, holiday.Date);

        return Ok(new { holiday.HolidayId, holiday.BranchId, holiday.Date, holiday.Reason, holiday.IsRecurringYearly });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertHolidayRequest req, CancellationToken ct)
    {
        var holiday = await uow.Holidays.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Ngày nghỉ {id} không tồn tại.");

        if (holiday.BranchId.HasValue)
            await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, holiday.BranchId.Value, uow, ct);
        else if (HttpContext.GetRole() != Roles.SuperAdmin)
            throw new ForbiddenException("Chỉ SuperAdmin mới có thể sửa ngày nghỉ toàn hệ thống.");

        if (req.BranchId.HasValue)
            await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, req.BranchId.Value, uow, ct);
        else if (HttpContext.GetRole() != Roles.SuperAdmin)
            throw new ForbiddenException("Chỉ SuperAdmin mới có thể tạo ngày nghỉ áp dụng toàn hệ thống.");

        holiday.BranchId          = req.BranchId;
        holiday.Date              = req.Date;
        holiday.Reason            = req.Reason;
        holiday.IsRecurringYearly = req.IsRecurringYearly;

        uow.Holidays.Update(holiday);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var holiday = await uow.Holidays.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Ngày nghỉ {id} không tồn tại.");

        if (holiday.BranchId.HasValue)
            await TenantGuard.RequireBranchWriteAccessAsync(HttpContext, holiday.BranchId.Value, uow, ct);
        else if (HttpContext.GetRole() != Roles.SuperAdmin)
            throw new ForbiddenException("Chỉ SuperAdmin mới có thể xóa ngày nghỉ toàn hệ thống.");

        uow.Holidays.Remove(holiday);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} deleted holiday {HolidayId}", HttpContext.GetUserId(), id);

        return NoContent();
    }
}

public record UpsertHolidayRequest(
    Guid? BranchId,
    DateOnly Date,
    string Reason,
    bool IsRecurringYearly = false
);
