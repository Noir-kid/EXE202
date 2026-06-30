using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.API.Middleware;
using SportSG.Application.Services;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    // ── Tổng quan (overview theo role) ──────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        return role switch
        {
            Roles.SuperAdmin =>
                Ok(await dashboardService.GetSuperAdminAsync(ct)),

            Roles.PartnerAdmin when partnerId.HasValue =>
                Ok(await dashboardService.GetPartnerAdminAsync(partnerId.Value, ct)),

            Roles.BranchManager when branchId.HasValue =>
                Ok(await dashboardService.GetBranchManagerAsync(branchId.Value, ct)),

            Roles.Staff when branchId.HasValue =>
                Ok(await dashboardService.GetStaffAsync(branchId.Value, ct)),

            _ => Forbid()
        };
    }

    // ── Báo cáo doanh thu (revenue report theo role) ─────────────────────

    /// <summary>
    /// SuperAdmin: tổng doanh thu toàn hệ thống, breakdown theo từng partner.
    /// PartnerAdmin: doanh thu của partner mình, không thấy partner khác.
    /// </summary>
    [HttpGet("revenue")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Revenue(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();

        if (role == Roles.SuperAdmin)
            return Ok(await dashboardService.GetRevenueReportAsync(ct));

        if (role == Roles.PartnerAdmin && partnerId.HasValue)
            return Ok(await dashboardService.GetPartnerRevenueReportAsync(partnerId.Value, ct));

        throw new ForbiddenException("Không có quyền xem báo cáo doanh thu.");
    }
}
