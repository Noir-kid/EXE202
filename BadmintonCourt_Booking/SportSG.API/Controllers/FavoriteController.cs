using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Application.Services;
using SportSG.Domain.Enums;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/favorites")]
[Authorize(Roles = Roles.Customer)]
public class FavoriteController(IFavoriteService favoriteService) : ControllerBase
{
    /// <summary>Danh sách sân yêu thích của tôi.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMyFavorites(CancellationToken ct)
    {
        var items = await favoriteService.GetByUserAsync(HttpContext.GetUserId(), ct);
        return Ok(items);
    }

    /// <summary>Toggle yêu thích/bỏ yêu thích một sân.</summary>
    [HttpPost("{courtId:guid}")]
    public async Task<IActionResult> Toggle(Guid courtId, CancellationToken ct)
    {
        var isFavorited = await favoriteService.ToggleAsync(HttpContext.GetUserId(), courtId, ct);
        return Ok(new { isFavorited, courtId });
    }
}
