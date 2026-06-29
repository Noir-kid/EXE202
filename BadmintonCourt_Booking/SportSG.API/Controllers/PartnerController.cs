using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportSG.API.Extensions;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/partners")]
[Authorize]
public class PartnerController(IUnitOfWork uow) : ControllerBase
{
    /// <summary>SuperAdmin: list all partners.</summary>
    [HttpGet]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var partners = await uow.Partners.GetAllAsync(ct);
        return Ok(partners.Select(p => new {
            p.PartnerId, p.Name, p.ContactEmail, p.ContactPhone,
            p.Status, p.CommissionRate, p.CreatedAt
        }));
    }

    /// <summary>Partner registers on platform.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterPartnerRequest req, CancellationToken ct)
    {
        var partner = new Partner
        {
            Name         = req.Name,
            LegalName    = req.LegalName,
            TaxCode      = req.TaxCode,
            ContactEmail = req.ContactEmail,
            ContactPhone = req.ContactPhone,
            Website      = req.Website,
        };
        await uow.Partners.AddAsync(partner, ct);
        await uow.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = partner.PartnerId }, new { partner.PartnerId, partner.Name, partner.Status });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        // PartnerAdmin can only view their own
        var callerId  = HttpContext.GetPartnerId();
        var callerRole = HttpContext.GetRole();
        if (callerRole == Roles.PartnerAdmin && callerId != id)
            return Forbid();

        var partner = await uow.Partners.GetByIdAsync(id, ct);
        return partner is null ? NotFound() : Ok(partner);
    }

    /// <summary>SuperAdmin approves or rejects partner.</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetPartnerStatusRequest req, CancellationToken ct)
    {
        var partner = await uow.Partners.GetByIdAsync(id, ct);
        if (partner is null) return NotFound();

        partner.Status     = req.Status;
        partner.ApprovedAt = req.Status == PartnerStatus.Active ? DateTime.UtcNow : null;
        partner.ApprovedBy = HttpContext.GetUserId();
        partner.UpdatedAt  = DateTime.UtcNow;

        uow.Partners.Update(partner);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>PartnerAdmin updates their own profile.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePartnerRequest req, CancellationToken ct)
    {
        var callerPartner = HttpContext.GetPartnerId();
        if (HttpContext.GetRole() == Roles.PartnerAdmin && callerPartner != id)
            return Forbid();

        var partner = await uow.Partners.GetByIdAsync(id, ct);
        if (partner is null) return NotFound();

        partner.Name         = req.Name;
        partner.ContactPhone = req.ContactPhone;
        partner.LogoUrl      = req.LogoUrl;
        partner.Website      = req.Website;
        partner.UpdatedAt    = DateTime.UtcNow;

        uow.Partners.Update(partner);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }
}

public record RegisterPartnerRequest(
    string Name, string? LegalName, string? TaxCode,
    string ContactEmail, string? ContactPhone, string? Website);

public record SetPartnerStatusRequest(PartnerStatus Status);

public record UpdatePartnerRequest(
    string Name, string? ContactPhone, string? LogoUrl, string? Website);
