using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var role = HttpContext.GetRole();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.PartnerUserRoles.Query()
            .Include(p => p.User)
            .Include(p => p.Role)
            .Include(p => p.Branch)
            .AsQueryable();

        if (role == Roles.PartnerAdmin && partnerId.HasValue)
            q = q.Where(p => p.PartnerId == partnerId);
        else if (role == Roles.BranchManager && branchId.HasValue)
            q = q.Where(p => p.BranchId == branchId);

        var staff = await q.Select(p => new {
            p.User.UserId, p.User.Email,
            p.User.FirstName, p.User.LastName,
            p.User.Phone, p.User.AvatarUrl,
            p.User.IsActive, p.User.CreatedAt,
            RoleCode = p.Role.Code, RoleName = p.Role.Name,
            BranchName = p.Branch != null ? p.Branch.Name : null,
            p.BranchId, p.PartnerId,
        }).ToListAsync(ct);

        // Also return customers (no PartnerUserRole) for SuperAdmin
        if (role == Roles.SuperAdmin)
        {
            var customers = await uow.Users.Query()
                .Where(u => !uow.PartnerUserRoles.Query().Any(p => p.UserId == u.UserId))
                .Select(u => new {
                    u.UserId, u.Email, u.FirstName, u.LastName,
                    u.Phone, u.AvatarUrl, u.IsActive, u.CreatedAt,
                    RoleCode = "Customer", RoleName = "Khách hàng",
                    BranchName = (string?)null, BranchId = (Guid?)null, PartnerId = (Guid?)null,
                }).ToListAsync(ct);
            return Ok(staff.Cast<object>().Concat(customers.Cast<object>()));
        }

        return Ok(staff);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
    {
        var roles = await uow.Roles.GetAllAsync(ct);
        return Ok(roles.Select(r => new { r.RoleId, r.Code, r.Name }));
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(HttpContext.GetUserId(), ct);
        return user is null ? NotFound() : Ok(new {
            user.UserId, user.Email, user.FirstName, user.LastName,
            user.Phone, user.AvatarUrl, user.IsActive, user.CreatedAt,
        });
    }

    [HttpPatch("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(HttpContext.GetUserId(), ct);
        if (user is null) return NotFound();
        user.FirstName = req.FirstName ?? user.FirstName;
        user.LastName  = req.LastName  ?? user.LastName;
        user.Phone     = req.Phone     ?? user.Phone;
        user.AvatarUrl = req.AvatarUrl ?? user.AvatarUrl;
        user.UpdatedAt = DateTime.UtcNow;
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);
        return Ok(new { user.UserId, user.Email, user.FirstName, user.LastName, user.Phone, user.AvatarUrl });
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin}")]
    public async Task<IActionResult> ToggleStatus(Guid id, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(id, ct);
        if (user is null) return NotFound();
        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);
        return Ok(new { user.IsActive });
    }

    /// <summary>PartnerAdmin or BranchManager creates a Staff account under their branch.</summary>
    [HttpPost("staff")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest req, CancellationToken ct)
    {
        if (await uow.Users.AnyAsync(u => u.Email == req.Email.ToLower(), ct))
            return BadRequest("Email đã được sử dụng.");

        var callerRole    = HttpContext.GetRole();
        var callerPartner = HttpContext.GetPartnerId();
        var callerBranch  = HttpContext.GetBranchId();

        var staffRoleId = 4; // Staff role from seed data
        var partnerId   = req.PartnerId ?? callerPartner ?? Guid.Empty;
        var branchId    = req.BranchId  ?? callerBranch;

        var user = new Domain.Entities.User
        {
            Email        = req.Email.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FirstName    = req.FirstName,
            LastName     = req.LastName,
            Phone        = req.Phone,
        };

        await uow.Users.AddAsync(user, ct);

        var roleMapping = new Domain.Entities.PartnerUserRole
        {
            UserId    = user.UserId,
            PartnerId = partnerId,
            BranchId  = branchId,
            RoleId    = staffRoleId,
        };
        await uow.PartnerUserRoles.AddAsync(roleMapping, ct);
        await uow.SaveChangesAsync(ct);

        return Ok(new { user.UserId, user.Email });
    }
}

public record UpdateProfileRequest(
    string? FirstName, string? LastName, string? Phone, string? AvatarUrl
);

public record CreateStaffRequest(
    string Email, string Password,
    string? FirstName, string? LastName, string? Phone,
    Guid? PartnerId, Guid? BranchId
);
