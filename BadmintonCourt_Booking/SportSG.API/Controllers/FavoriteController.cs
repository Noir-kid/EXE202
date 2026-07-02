using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Application.Repositories;
using SportSG.Application.Services;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoriteController(IFavoriteService favoriteService, IUnitOfWork uow) : ControllerBase
{
    /// <summary>Danh sách sân yêu thích của tôi.</summary>
    [HttpGet]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> GetMyFavorites(CancellationToken ct)
    {
        var items = await favoriteService.GetByUserAsync(HttpContext.GetUserId(), ct);
        return Ok(items);
    }

    /// <summary>Toggle yêu thích/bỏ yêu thích một sân.</summary>
    [HttpPost("{courtId:guid}")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Toggle(Guid courtId, CancellationToken ct)
    {
        var isFavorited = await favoriteService.ToggleAsync(HttpContext.GetUserId(), courtId, ct);
        return Ok(new { isFavorited, courtId });
    }

    /// <summary>
    /// Thống kê số lượt yêu thích theo sân, phục vụ admin.
    /// SuperAdmin: tất cả. PartnerAdmin: sân thuộc partner mình.
    /// BranchManager / Staff: sân thuộc chi nhánh mình.
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager},{Roles.Staff}")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Courts.Query().Include(c => c.Branch).AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(c => c.Branch.PartnerId == partnerId),
            Roles.BranchManager => q.Where(c => c.BranchId == branchId),
            Roles.Staff         => q.Where(c => c.BranchId == branchId),
            _                   => q.Where(c => false),
        };

        var items = await q
            .Select(c => new {
                c.CourtId, c.Name,
                BranchName    = c.Branch.Name,
                FavoriteCount = c.Favorites.Count,
            })
            .Where(c => c.FavoriteCount > 0)
            .OrderByDescending(c => c.FavoriteCount)
            .ToListAsync(ct);

        return Ok(items);
    }
}
