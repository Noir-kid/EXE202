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
[Route("api/partners")]
[Authorize]
public class PartnerController(IUnitOfWork uow, ILogger<PartnerController> logger) : ControllerBase
{
    // ── SuperAdmin: list all partners ────────────────────────────────────

    [HttpGet]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> GetAll(
        [FromQuery] PartnerStatus? status,
        CancellationToken ct)
    {
        var q = uow.Partners.Query();
        if (status.HasValue) q = q.Where(p => p.Status == status.Value);

        var partners = await q
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new {
                p.PartnerId, p.Name, p.LegalName,
                p.ContactEmail, p.ContactPhone, p.Website,
                p.CommissionRate, p.Status, p.CreatedAt, p.ApprovedAt
            })
            .ToListAsync(ct);

        return Ok(partners);
    }

    // ── SuperAdmin: create partner directly (Active) ─────────────────────

    /// <summary>
    /// SuperAdmin tạo Partner trực tiếp — status mặc định Active, không cần quy trình Pending.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Create([FromBody] CreatePartnerRequest req, CancellationToken ct)
    {
        // Validate uniqueness
        if (await uow.Partners.AnyAsync(p => p.ContactEmail == req.Email.ToLower(), ct))
            throw new ConflictException($"Email '{req.Email}' đã được sử dụng bởi partner khác.");

        if (await uow.Partners.AnyAsync(p => p.Name == req.CompanyName, ct))
            throw new ConflictException($"Tên công ty '{req.CompanyName}' đã tồn tại.");

        var partner = new Partner
        {
            Name          = req.CompanyName,
            LegalName     = req.ContactName,
            ContactEmail  = req.Email.ToLower(),
            ContactPhone  = req.Phone,
            Website       = req.Website,
            CommissionRate = req.CommissionRate ?? 10m,
            Status        = PartnerStatus.Active,
            ApprovedAt    = DateTime.UtcNow,
            ApprovedBy    = HttpContext.GetUserId(),
        };

        await uow.Partners.AddAsync(partner, ct);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("SuperAdmin {UserId} created partner {Name} ({PartnerId})",
            HttpContext.GetUserId(), partner.Name, partner.PartnerId);

        return CreatedAtAction(nameof(GetById), new { id = partner.PartnerId }, new {
            partner.PartnerId, partner.Name, partner.Status, partner.CommissionRate
        });
    }

    // ── Get partner by id ────────────────────────────────────────────────

    [HttpGet("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var partner = await TenantGuard.RequirePartnerAccessAsync(HttpContext, id, uow, ct);

        var branches = await uow.Branches.FindAsync(b => b.PartnerId == id, ct);
        var courtCount = await uow.Courts.CountAsync(c => c.Branch.PartnerId == id, ct);
        var memberCount = await uow.PartnerUserRoles.CountAsync(r => r.PartnerId == id && r.IsActive, ct);

        return Ok(new {
            partner.PartnerId, partner.Name, partner.LegalName, partner.TaxCode,
            partner.ContactEmail, partner.ContactPhone, partner.Website, partner.LogoUrl,
            partner.CommissionRate, partner.Status, partner.CreatedAt, partner.ApprovedAt,
            BranchCount = branches.Count,
            CourtCount  = courtCount,
            MemberCount = memberCount,
        });
    }

    // ── Partner registers themselves (public) ────────────────────────────

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterPartnerRequest req, CancellationToken ct)
    {
        if (await uow.Partners.AnyAsync(p => p.ContactEmail == req.ContactEmail.ToLower(), ct))
            throw new ConflictException($"Email '{req.ContactEmail}' đã được đăng ký.");

        var partner = new Partner
        {
            Name         = req.Name,
            LegalName    = req.LegalName,
            TaxCode      = req.TaxCode,
            ContactEmail = req.ContactEmail.ToLower(),
            ContactPhone = req.ContactPhone,
            Website      = req.Website,
            Status       = PartnerStatus.Pending,
        };
        await uow.Partners.AddAsync(partner, ct);
        await uow.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = partner.PartnerId },
            new { partner.PartnerId, partner.Name, partner.Status });
    }

    // ── SuperAdmin: approve / reject partner ─────────────────────────────

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> SetStatus(Guid id, [FromBody] SetPartnerStatusRequest req, CancellationToken ct)
    {
        var partner = await uow.Partners.GetByIdAsync(id, ct)
            ?? throw new NotFoundException($"Partner {id} không tồn tại.");

        partner.Status     = req.Status;
        partner.ApprovedAt = req.Status == PartnerStatus.Active ? DateTime.UtcNow : null;
        partner.ApprovedBy = HttpContext.GetUserId();
        partner.UpdatedAt  = DateTime.UtcNow;

        uow.Partners.Update(partner);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("SuperAdmin {UserId} set partner {PartnerId} status → {Status}",
            HttpContext.GetUserId(), id, req.Status);

        return NoContent();
    }

    // ── PartnerAdmin: update own profile ─────────────────────────────────

    [HttpPut("{id:guid}")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePartnerRequest req, CancellationToken ct)
    {
        var partner = await TenantGuard.RequirePartnerAccessAsync(HttpContext, id, uow, ct);

        partner.Name         = req.Name;
        partner.ContactPhone = req.ContactPhone;
        partner.LogoUrl      = req.LogoUrl;
        partner.Website      = req.Website;
        partner.UpdatedAt    = DateTime.UtcNow;

        uow.Partners.Update(partner);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    // ── Members: list ─────────────────────────────────────────────────────

    /// <summary>
    /// Liệt kê tất cả user được gán vai trò trong partner này.
    /// SuperAdmin xem bất kỳ, PartnerAdmin chỉ xem partner của mình.
    /// </summary>
    [HttpGet("{partnerId:guid}/members")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> ListMembers(Guid partnerId, CancellationToken ct)
    {
        await TenantGuard.RequirePartnerAccessAsync(HttpContext, partnerId, uow, ct);

        var members = await uow.PartnerUserRoles.Query()
            .Where(r => r.PartnerId == partnerId && r.IsActive)
            .Include(r => r.User)
            .Include(r => r.Role)
            .Include(r => r.Branch)
            .Select(r => new {
                r.Id,
                r.UserId,
                UserName  = r.User.FirstName + " " + r.User.LastName,
                Email     = r.User.Email,
                RoleCode  = r.Role.Code,
                RoleName  = r.Role.Name,
                r.BranchId,
                BranchName = r.Branch != null ? r.Branch.Name : null,
                r.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(members);
    }

    // ── Members: assign ──────────────────────────────────────────────────

    /// <summary>
    /// SuperAdmin gán một User vào vai trò trong Partner.
    /// Nếu roleCode = PartnerAdmin → User không được có PartnerAdmin ở partner khác.
    /// Nếu roleCode = BranchManager / Staff → phải kèm branchId hợp lệ thuộc partner.
    /// </summary>
    [HttpPost("{partnerId:guid}/members")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> AssignMember(
        Guid partnerId,
        [FromBody] AssignMemberRequest req,
        CancellationToken ct)
    {
        // Validate inputs
        if (string.IsNullOrWhiteSpace(req.RoleCode))
            return BadRequest(new { error = "RoleCode là bắt buộc." });

        var allowedRoles = new[] { Roles.PartnerAdmin, Roles.BranchManager, Roles.Staff };
        if (!allowedRoles.Contains(req.RoleCode))
            return BadRequest(new { error = $"RoleCode phải là một trong: {string.Join(", ", allowedRoles)}." });

        var partner = await uow.Partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException($"Partner {partnerId} không tồn tại.");

        if (partner.Status != PartnerStatus.Active)
            throw new BusinessException("Chỉ có thể gán thành viên cho Partner đang Active.");

        var user = await uow.Users.GetByIdAsync(req.UserId, ct)
            ?? throw new NotFoundException($"User {req.UserId} không tồn tại.");

        var role = await uow.Roles.FirstOrDefaultAsync(r => r.Code == req.RoleCode, ct)
            ?? throw new NotFoundException($"Role '{req.RoleCode}' không tồn tại trong hệ thống.");

        // Rule: 1 user chỉ là PartnerAdmin của 1 partner tại một thời điểm
        if (req.RoleCode == Roles.PartnerAdmin)
        {
            var existingAdmin = await uow.PartnerUserRoles.AnyAsync(
                r => r.UserId == req.UserId
                  && r.RoleId == role.RoleId
                  && r.IsActive
                  && r.PartnerId != partnerId, ct);

            if (existingAdmin)
                throw new BusinessException(
                    $"User '{user.Email}' đã là PartnerAdmin của partner khác. Một user chỉ có thể quản lý một partner.");
        }

        // BranchManager / Staff phải có branchId thuộc partner
        Guid? branchId = null;
        if (req.RoleCode is Roles.BranchManager or Roles.Staff)
        {
            if (!req.BranchId.HasValue)
                throw new BusinessException($"BranchId là bắt buộc khi gán role {req.RoleCode}.");

            var branch = await uow.Branches.GetByIdAsync(req.BranchId.Value, ct)
                ?? throw new NotFoundException($"Chi nhánh {req.BranchId} không tồn tại.");

            if (branch.PartnerId != partnerId)
                throw new BusinessException("Chi nhánh này không thuộc partner được chỉ định.");

            branchId = branch.BranchId;
        }

        // Check for existing assignment (active or inactive) to avoid unique-index violation
        var existing = await uow.PartnerUserRoles.FirstOrDefaultAsync(
            r => r.UserId == req.UserId
              && r.PartnerId == partnerId
              && r.RoleId == role.RoleId
              && r.BranchId == branchId, ct);

        int assignmentId;
        if (existing is not null)
        {
            if (existing.IsActive)
                throw new ConflictException(
                    $"User '{user.Email}' đã có role '{req.RoleCode}' trong partner này.");

            // Reactivate the previously deactivated assignment
            existing.IsActive = true;
            uow.PartnerUserRoles.Update(existing);
            assignmentId = existing.Id;
        }
        else
        {
            var assignment = new PartnerUserRole
            {
                UserId    = req.UserId,
                PartnerId = partnerId,
                BranchId  = branchId,
                RoleId    = role.RoleId,
                IsActive  = true,
            };
            await uow.PartnerUserRoles.AddAsync(assignment, ct);
            assignmentId = assignment.Id;
        }

        await uow.SaveChangesAsync(ct);

        logger.LogInformation(
            "SuperAdmin {AdminId} assigned user {UserId} as {Role} in partner {PartnerId}",
            HttpContext.GetUserId(), req.UserId, req.RoleCode, partnerId);

        return Ok(new {
            Id        = assignmentId,
            UserId    = req.UserId,
            UserName  = user.Email,
            RoleCode  = req.RoleCode,
            PartnerId = partnerId,
            BranchId  = branchId,
        });
    }

    // ── Members: remove ──────────────────────────────────────────────────

    /// <summary>
    /// SuperAdmin thu hồi vai trò của một thành viên trong partner.
    /// Sử dụng soft-delete (IsActive = false).
    /// </summary>
    [HttpDelete("{partnerId:guid}/members/{assignmentId:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> RemoveMember(
        Guid partnerId, int assignmentId, CancellationToken ct)
    {
        var assignment = await uow.PartnerUserRoles.FirstOrDefaultAsync(
            r => r.Id == assignmentId && r.PartnerId == partnerId && r.IsActive, ct)
            ?? throw new NotFoundException("Không tìm thấy assignment này.");

        assignment.IsActive = false;
        uow.PartnerUserRoles.Update(assignment);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation(
            "SuperAdmin {AdminId} removed assignment {AssignmentId} from partner {PartnerId}",
            HttpContext.GetUserId(), assignmentId, partnerId);

        return NoContent();
    }
}

// ── Request Records ──────────────────────────────────────────────────────────

public record CreatePartnerRequest(
    string CompanyName,
    string? ContactName,
    string Email,
    string? Phone,
    string? Website,
    decimal? CommissionRate
);

public record RegisterPartnerRequest(
    string Name,
    string? LegalName,
    string? TaxCode,
    string ContactEmail,
    string? ContactPhone,
    string? Website
);

public record SetPartnerStatusRequest(PartnerStatus Status);

public record UpdatePartnerRequest(
    string Name,
    string? ContactPhone,
    string? LogoUrl,
    string? Website
);

public record AssignMemberRequest(
    Guid UserId,
    string RoleCode,
    Guid? BranchId   // required for BranchManager / Staff
);
