using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Application.Services;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
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
}
