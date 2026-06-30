using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.API.Middleware;
using SportSG.Application.Repositories;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;

namespace SportSG.API.Authorization;

/// <summary>
/// Centralised multi-tenant access guard.
/// All three methods throw NotFoundException or ForbiddenException (handled by ExceptionMiddleware)
/// so controllers stay thin — one await call, no repeated if-chains.
/// </summary>
public static class TenantGuard
{
    // ── Partner ──────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the Partner if the caller is allowed to access it.
    /// SuperAdmin: any partner.
    /// PartnerAdmin: only their own partner (from JWT claim).
    /// Others: always Forbidden.
    /// </summary>
    public static async Task<Partner> RequirePartnerAccessAsync(
        HttpContext ctx, Guid partnerId, IUnitOfWork uow, CancellationToken ct = default)
    {
        var partner = await uow.Partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException($"Partner {partnerId} không tồn tại.");

        var role = ctx.GetRole();
        if (role == Roles.SuperAdmin) return partner;

        if (role == Roles.PartnerAdmin)
        {
            if (ctx.GetPartnerId() != partnerId)
                throw new ForbiddenException("Bạn không có quyền truy cập partner này.");
            return partner;
        }

        throw new ForbiddenException("Không có quyền truy cập partner.");
    }

    // ── Branch ───────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the Branch if the caller is allowed to access it.
    /// SuperAdmin: any branch.
    /// PartnerAdmin: branch must belong to their partner.
    /// BranchManager / Staff: only their own branch (from JWT claim).
    /// </summary>
    public static async Task<Branch> RequireBranchAccessAsync(
        HttpContext ctx, Guid branchId, IUnitOfWork uow, CancellationToken ct = default)
    {
        var branch = await uow.Branches.GetByIdAsync(branchId, ct)
            ?? throw new NotFoundException($"Chi nhánh {branchId} không tồn tại.");

        var role = ctx.GetRole();
        if (role == Roles.SuperAdmin) return branch;

        if (role == Roles.PartnerAdmin)
        {
            var jwtPartnerId = ctx.GetPartnerId();
            if (!jwtPartnerId.HasValue)
                throw new BusinessException(
                    "Phiên đăng nhập chưa có thông tin Partner. Vui lòng đăng xuất và đăng nhập lại.");
            if (branch.PartnerId != jwtPartnerId.Value)
                throw new ForbiddenException("Chi nhánh này không thuộc partner của bạn.");
            return branch;
        }

        if (role is Roles.BranchManager or Roles.Staff)
        {
            if (branch.BranchId != ctx.GetBranchId())
                throw new ForbiddenException("Bạn không có quyền truy cập chi nhánh này.");
            return branch;
        }

        throw new ForbiddenException("Không có quyền truy cập chi nhánh.");
    }

    /// <summary>
    /// Same as RequireBranchAccessAsync but only allows write-level roles (no Staff).
    /// </summary>
    public static async Task<Branch> RequireBranchWriteAccessAsync(
        HttpContext ctx, Guid branchId, IUnitOfWork uow, CancellationToken ct = default)
    {
        var branch = await uow.Branches.GetByIdAsync(branchId, ct)
            ?? throw new NotFoundException($"Chi nhánh {branchId} không tồn tại.");

        var role = ctx.GetRole();
        if (role == Roles.SuperAdmin) return branch;

        if (role == Roles.PartnerAdmin)
        {
            var jwtPartnerId = ctx.GetPartnerId();
            if (!jwtPartnerId.HasValue)
                throw new BusinessException(
                    "Phiên đăng nhập chưa có thông tin Partner. Vui lòng đăng xuất và đăng nhập lại.");
            if (branch.PartnerId != jwtPartnerId.Value)
                throw new ForbiddenException("Chi nhánh này không thuộc partner của bạn.");
            return branch;
        }

        if (role == Roles.BranchManager)
        {
            if (branch.BranchId != ctx.GetBranchId())
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa chi nhánh này.");
            return branch;
        }

        throw new ForbiddenException("Không có quyền chỉnh sửa chi nhánh.");
    }

    // ── Court ────────────────────────────────────────────────────────────

    /// <summary>
    /// Returns the Court (with Branch loaded) if the caller may access it.
    /// Chain: Court → Branch → Partner.
    /// SuperAdmin: any court.
    /// PartnerAdmin: court's branch must belong to their partner.
    /// BranchManager / Staff: court must be in their branch.
    /// </summary>
    public static async Task<Court> RequireCourtAccessAsync(
        HttpContext ctx, Guid courtId, IUnitOfWork uow, CancellationToken ct = default)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch)
            .FirstOrDefaultAsync(c => c.CourtId == courtId, ct)
            ?? throw new NotFoundException($"Sân {courtId} không tồn tại.");

        var role = ctx.GetRole();
        if (role == Roles.SuperAdmin) return court;

        if (role == Roles.PartnerAdmin)
        {
            var jwtPartnerId = ctx.GetPartnerId();
            if (!jwtPartnerId.HasValue)
                throw new BusinessException(
                    "Phiên đăng nhập chưa có thông tin Partner. Vui lòng đăng xuất và đăng nhập lại.");
            if (court.Branch.PartnerId != jwtPartnerId.Value)
                throw new ForbiddenException("Sân này không thuộc partner của bạn.");
            return court;
        }

        if (role is Roles.BranchManager or Roles.Staff)
        {
            if (court.BranchId != ctx.GetBranchId())
                throw new ForbiddenException("Sân này không thuộc chi nhánh của bạn.");
            return court;
        }

        throw new ForbiddenException("Không có quyền truy cập sân.");
    }

    // ── Branch ownership check (for court creation) ───────────────────────

    /// <summary>
    /// Verifies that a Branch exists and belongs to the caller's partner before creating a court inside it.
    /// SuperAdmin can use any branch. PartnerAdmin's branch must match their partner.
    /// </summary>
    public static async Task RequireBranchOwnershipAsync(
        HttpContext ctx, Guid branchId, IUnitOfWork uow, CancellationToken ct = default)
    {
        // Always validate branch exists — even for SuperAdmin, to return 404 instead of a FK constraint error.
        var branch = await uow.Branches.GetByIdAsync(branchId, ct)
            ?? throw new NotFoundException($"Chi nhánh {branchId} không tồn tại.");

        var role = ctx.GetRole();
        if (role == Roles.SuperAdmin) return;

        if (role == Roles.PartnerAdmin)
        {
            var jwtPartnerId = ctx.GetPartnerId();
            if (!jwtPartnerId.HasValue)
                throw new BusinessException(
                    "Phiên đăng nhập chưa có thông tin Partner. Vui lòng đăng xuất và đăng nhập lại.");

            if (branch.PartnerId != jwtPartnerId.Value)
                throw new ForbiddenException("Branch này không thuộc partner của bạn.");
        }
    }
}
