using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Revenue;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Queries.Revenue;

// ── ADMIN REVENUE ────────────────────────────────────────────────────────────
public record GetAdminRevenueQuery(RevenueQueryFilter Filter) : IRequest<Result<AdminRevenueResponse>>;

public class GetAdminRevenueQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetAdminRevenueQuery, Result<AdminRevenueResponse>>
{
    public async Task<Result<AdminRevenueResponse>> Handle(GetAdminRevenueQuery req, CancellationToken ct)
    {
        var filter = req.Filter;
        var from = filter.From?.ToDateTime(TimeOnly.MinValue) ?? DateTime.MinValue;
        var to = filter.To?.ToDateTime(TimeOnly.MaxValue) ?? DateTime.MaxValue;

        // Materialize to avoid DateOnly translation issues
        var payments = await uow.Payments.Query()
            .Include(p => p.Booking).ThenInclude(b => b.Court).ThenInclude(c => c.Branch).ThenInclude(br => br.Owner)
            .Where(p => p.Status == PaymentStatus.Success && p.PaidAt >= from && p.PaidAt <= to)
            .Select(p => new
            {
                p.Amount,
                p.PaidAt,
                p.OwnerId,
                OwnerName = p.Booking.Court.Branch.Owner.Name,
                CommissionRate = p.Booking.Court.Branch.Owner.CommissionRate,
                p.Booking.Court.SportType,
                BranchId = p.Booking.BranchId
            })
            .ToListAsync(ct);

        var totalGross = payments.Sum(p => p.Amount);
        var totalCommission = payments.Sum(p => Math.Round(p.Amount * p.CommissionRate / 100, 0));
        var totalPayout = totalGross - totalCommission;

        var byOwner = payments
            .GroupBy(p => new { p.OwnerId, p.OwnerName, p.CommissionRate })
            .Select(g => new RevenueByOwner(
                g.Key.OwnerId,
                g.Key.OwnerName,
                g.Sum(p => p.Amount),
                g.Sum(p => Math.Round(p.Amount * g.Key.CommissionRate / 100, 0)),
                g.Count()))
            .OrderByDescending(x => x.GrossRevenue)
            .ToList();

        var byDay = payments
            .Where(p => p.PaidAt.HasValue)
            .GroupBy(p => DateOnly.FromDateTime(p.PaidAt!.Value))
            .Select(g => new RevenueByDay(g.Key, g.Sum(p => p.Amount), g.Count()))
            .OrderBy(x => x.Date)
            .ToList();

        var bySport = payments
            .GroupBy(p => p.SportType.ToString())
            .Select(g => new RevenueBySport(g.Key, g.Sum(p => p.Amount), g.Count()))
            .ToList();

        return Result<AdminRevenueResponse>.Success(new AdminRevenueResponse(
            totalGross, totalCommission, totalPayout, payments.Count, payments.Count,
            byOwner, byDay, bySport));
    }
}

// ── OWNER REVENUE ────────────────────────────────────────────────────────────
public record GetOwnerRevenueQuery(Guid OwnerId, RevenueQueryFilter Filter) : IRequest<Result<OwnerRevenueResponse>>;

public class GetOwnerRevenueQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetOwnerRevenueQuery, Result<OwnerRevenueResponse>>
{
    public async Task<Result<OwnerRevenueResponse>> Handle(GetOwnerRevenueQuery req, CancellationToken ct)
    {
        var filter = req.Filter;
        var from = filter.From?.ToDateTime(TimeOnly.MinValue) ?? DateTime.MinValue;
        var to = filter.To?.ToDateTime(TimeOnly.MaxValue) ?? DateTime.MaxValue;

        var owner = await uow.Owners.GetByIdAsync(req.OwnerId, ct);
        if (owner is null) return Result<OwnerRevenueResponse>.NotFound("Owner not found.");

        var payments = await uow.Payments.Query()
            .Include(p => p.Booking).ThenInclude(b => b.Court)
            .Where(p => p.OwnerId == req.OwnerId &&
                        p.Status == PaymentStatus.Success &&
                        p.PaidAt >= from && p.PaidAt <= to)
            .Select(p => new
            {
                p.Amount,
                p.PaidAt,
                p.Booking.BranchId,
                BranchName = p.Booking.Court.Branch.Name,
                p.Booking.Court.SportType
            })
            .ToListAsync(ct);

        var grossRevenue = payments.Sum(p => p.Amount);
        var commission = Math.Round(grossRevenue * owner.CommissionRate / 100, 0);

        var byBranch = payments
            .GroupBy(p => new { p.BranchId, p.BranchName })
            .Select(g => new RevenueByBranch(g.Key.BranchId, g.Key.BranchName, g.Sum(p => p.Amount), g.Count()))
            .ToList();

        var byDay = payments
            .Where(p => p.PaidAt.HasValue)
            .GroupBy(p => DateOnly.FromDateTime(p.PaidAt!.Value))
            .Select(g => new RevenueByDay(g.Key, g.Sum(p => p.Amount), g.Count()))
            .OrderBy(x => x.Date)
            .ToList();

        var bySport = payments
            .GroupBy(p => p.SportType.ToString())
            .Select(g => new RevenueBySport(g.Key, g.Sum(p => p.Amount), g.Count()))
            .ToList();

        return Result<OwnerRevenueResponse>.Success(new OwnerRevenueResponse(
            req.OwnerId, owner.Name, grossRevenue, commission, grossRevenue - commission,
            payments.Count, byBranch, byDay, bySport));
    }
}