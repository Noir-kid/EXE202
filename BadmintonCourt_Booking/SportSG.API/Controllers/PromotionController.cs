using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/promotions")]
[Authorize]
public class PromotionController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();

        var all = await uow.Promotions.GetAllAsync(ct);
        var result = role == Roles.SuperAdmin
            ? all
            : all.Where(p => p.PartnerId == null || p.PartnerId == partnerId);

        return Ok(result.Select(p => new {
            p.PromotionId, p.Code, p.Name, p.Description,
            p.DiscountType, p.DiscountValue, p.MinOrderAmount, p.MaxDiscount,
            p.UsageLimit, p.UsageCount, p.ValidFrom, p.ValidTo, p.IsActive,
        }));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Create([FromBody] PromotionRequest req, CancellationToken ct)
    {
        var promotion = new Promotion
        {
            Code           = req.Code.ToUpper(),
            Name           = req.Name,
            Description    = req.Description,
            DiscountType   = req.DiscountType,
            DiscountValue  = req.DiscountValue,
            MinOrderAmount = req.MinOrderAmount,
            MaxDiscount    = req.MaxDiscount,
            UsageLimit     = req.UsageLimit,
            ValidFrom      = req.ValidFrom,
            ValidTo        = req.ValidTo,
            PartnerId      = HttpContext.GetRole() == Roles.PartnerAdmin ? HttpContext.GetPartnerId() : null,
        };
        await uow.Promotions.AddAsync(promotion, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(new { promotion.PromotionId });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PromotionRequest req, CancellationToken ct)
    {
        var p = await uow.Promotions.GetByIdAsync(id, ct);
        if (p is null) return NotFound();
        p.Code           = req.Code.ToUpper();
        p.Name           = req.Name;
        p.Description    = req.Description;
        p.DiscountType   = req.DiscountType;
        p.DiscountValue  = req.DiscountValue;
        p.MinOrderAmount = req.MinOrderAmount;
        p.MaxDiscount    = req.MaxDiscount;
        p.UsageLimit     = req.UsageLimit;
        p.ValidFrom      = req.ValidFrom;
        p.ValidTo        = req.ValidTo;
        uow.Promotions.Update(p);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> ToggleStatus(Guid id, CancellationToken ct)
    {
        var p = await uow.Promotions.GetByIdAsync(id, ct);
        if (p is null) return NotFound();
        p.IsActive = !p.IsActive;
        uow.Promotions.Update(p);
        await uow.SaveChangesAsync(ct);
        return Ok(new { p.IsActive });
    }
}

public record PromotionRequest(
    string Code, string Name, string? Description,
    DiscountType DiscountType, decimal DiscountValue,
    decimal MinOrderAmount, decimal? MaxDiscount,
    int? UsageLimit, DateTime ValidFrom, DateTime ValidTo
);
