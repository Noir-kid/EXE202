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
[Route("api/maintenance-schedules")]
[Authorize]
public class MaintenanceController(IUnitOfWork uow, ILogger<MaintenanceController> logger) : ControllerBase
{
    /// <summary>
    /// SuperAdmin: tất cả. PartnerAdmin: các sân thuộc partner mình.
    /// BranchManager / Staff: các sân thuộc chi nhánh mình.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? courtId, CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Maintenances.Query()
            .Include(m => m.Court).ThenInclude(c => c.Branch)
            .AsQueryable();

        if (courtId.HasValue)
        {
            await TenantGuard.RequireCourtAccessAsync(HttpContext, courtId.Value, uow, ct);
            q = q.Where(m => m.CourtId == courtId);
        }
        else
        {
            q = role switch
            {
                Roles.SuperAdmin    => q,
                Roles.PartnerAdmin  => q.Where(m => m.Court.Branch.PartnerId == partnerId),
                Roles.BranchManager => q.Where(m => m.Court.BranchId == branchId),
                Roles.Staff         => q.Where(m => m.Court.BranchId == branchId),
                _                   => q.Where(m => false),
            };
        }

        var items = await q
            .OrderByDescending(m => m.StartTime)
            .Select(m => new {
                m.MaintenanceId, m.CourtId, m.StartTime, m.EndTime, m.Reason, m.Status,
                CourtName  = m.Court.Name,
                BranchName = m.Court.Branch.Name,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Create([FromBody] UpsertMaintenanceRequest req, CancellationToken ct)
    {
        if (req.StartTime >= req.EndTime)
            return BadRequest(new { error = "Thời gian bắt đầu phải trước thời gian kết thúc." });

        await TenantGuard.RequireCourtAccessAsync(HttpContext, req.CourtId, uow, ct);

        // EF Core không dịch được DateOnly.ToDateTime() trong LINQ-to-SQL — lọc theo ngày
        // trên server rồi so khớp giờ chính xác trên client với tập nhỏ đã tải về.
        var startDate = DateOnly.FromDateTime(req.StartTime);
        var endDate   = DateOnly.FromDateTime(req.EndTime);
        var candidateBookings = await uow.Bookings.Query()
            .Where(b => b.CourtId == req.CourtId
                && b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.NoShow
                && b.BookingDate >= startDate && b.BookingDate <= endDate)
            .Select(b => new { b.BookingDate, b.StartTime, b.EndTime })
            .ToListAsync(ct);

        var overlapsBooking = candidateBookings.Any(b =>
            b.BookingDate.ToDateTime(b.StartTime) < req.EndTime
            && b.BookingDate.ToDateTime(b.EndTime) > req.StartTime);

        if (overlapsBooking)
            throw new BusinessException("Khoảng thời gian này đã có booking. Hãy hủy booking trước khi đặt bảo trì.");

        var maintenance = new MaintenanceSchedule
        {
            CourtId   = req.CourtId,
            StartTime = req.StartTime,
            EndTime   = req.EndTime,
            Reason    = req.Reason,
            Status    = "Scheduled",
            CreatedBy = HttpContext.GetUserId(),
        };

        await uow.Maintenances.AddAsync(maintenance, ct);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} scheduled maintenance {MaintenanceId} for court {CourtId}",
            HttpContext.GetUserId(), maintenance.MaintenanceId, req.CourtId);

        return Ok(new {
            maintenance.MaintenanceId, maintenance.CourtId,
            maintenance.StartTime, maintenance.EndTime, maintenance.Reason, maintenance.Status,
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMaintenanceStatusRequest req, CancellationToken ct)
    {
        var maintenance = await uow.Maintenances.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Lịch bảo trì {id} không tồn tại.");

        await TenantGuard.RequireCourtAccessAsync(HttpContext, maintenance.CourtId, uow, ct);

        maintenance.Status = req.Status;

        uow.Maintenances.Update(maintenance);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var maintenance = await uow.Maintenances.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Lịch bảo trì {id} không tồn tại.");

        await TenantGuard.RequireCourtAccessAsync(HttpContext, maintenance.CourtId, uow, ct);

        uow.Maintenances.Remove(maintenance);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("User {UserId} deleted maintenance {MaintenanceId}", HttpContext.GetUserId(), id);

        return NoContent();
    }
}

public record UpsertMaintenanceRequest(
    Guid CourtId,
    DateTime StartTime,
    DateTime EndTime,
    string Reason
);

public record UpdateMaintenanceStatusRequest(string Status);
