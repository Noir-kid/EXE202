using Microsoft.EntityFrameworkCore;
using SportSG.Application.DTOs.Dashboard;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;
using SportSG.Domain.Entities;

namespace SportSG.Application.Services;

public class DashboardService(IUnitOfWork uow) : IDashboardService
{
    public async Task<SuperAdminDashboard> GetSuperAdminAsync(CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var totalPartners  = await uow.Partners.CountAsync(null, ct);
        var activePartners = await uow.Partners.CountAsync(p => p.Status == PartnerStatus.Active, ct);
        var pendingPartners= await uow.Partners.CountAsync(p => p.Status == PartnerStatus.Pending, ct);
        var totalUsers     = await uow.Users.CountAsync(null, ct);
        var todayStart     = today.ToDateTime(TimeOnly.MinValue);
        var newUsersToday  = await uow.Users.CountAsync(u => u.CreatedAt >= todayStart && u.CreatedAt < todayStart.AddDays(1), ct);

        var payments = await uow.Payments.Query()
            .Where(p => p.Status == PaymentStatus.Success)
            .ToListAsync(ct);

        var totalRevenue    = payments.Sum(p => p.Amount);
        var revenueToday    = payments.Where(p => p.PaidAt.HasValue && DateOnly.FromDateTime(p.PaidAt!.Value) == today).Sum(p => p.Amount);
        var commissionEarned = await uow.CommissionLedger.Query().SumAsync(c => c.CommissionAmt, ct);

        var totalBookings   = await uow.Bookings.CountAsync(null, ct);
        var bookingsToday   = await uow.Bookings.CountAsync(b => b.BookingDate == today, ct);

        // Revenue by last 30 days
        var since30      = today.AddDays(-29);
        var since30Start = since30.ToDateTime(TimeOnly.MinValue);
        var revenueChart = (await uow.Payments.Query()
            .Where(p => p.Status == PaymentStatus.Success && p.PaidAt >= since30Start)
            .Select(p => new { p.PaidAt, p.Amount })
            .ToListAsync(ct))
            .GroupBy(p => DateOnly.FromDateTime(p.PaidAt!.Value))
            .Select(g => new RevenueByDay(g.Key, g.Sum(p => p.Amount), g.Count()))
            .OrderBy(r => r.Date)
            .ToList();

        // Bookings by sport type
        var bookingsBySport = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.SportType)
            .GroupBy(b => b.Court.SportType.Name)
            .Select(g => new BookingsBySport(g.Key, g.Count(), g.Sum(b => b.TotalAmount)))
            .ToListAsync(ct);

        // Top 5 partners by revenue — GroupBy + Include không dịch được sang SQL
        // → Project ra anonymous type trước, materialize, rồi group trong memory
        var ledgerRows = await uow.CommissionLedger.Query()
            .Select(c => new { c.PartnerId, PartnerName = c.Partner.Name, c.GrossAmount })
            .ToListAsync(ct);

        var topPartners = ledgerRows
            .GroupBy(c => new { c.PartnerId, c.PartnerName })
            .Select(g => new TopPartnerItem(g.Key.PartnerId, g.Key.PartnerName, g.Sum(c => c.GrossAmount), g.Count()))
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        return new SuperAdminDashboard(
            totalPartners, activePartners, pendingPartners,
            totalUsers, newUsersToday,
            totalRevenue, commissionEarned, revenueToday,
            totalBookings, bookingsToday,
            revenueChart, bookingsBySport, topPartners);
    }

    public async Task<PartnerAdminDashboard> GetPartnerAdminAsync(Guid partnerId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var bookings = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch)
            .Where(b => b.Court.Branch.PartnerId == partnerId)
            .ToListAsync(ct);

        var totalRevenue      = bookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount);
        var revenueThisMonth  = bookings
            .Where(b => b.BookingDate.Month == today.Month && b.BookingDate.Year == today.Year && b.Status != BookingStatus.Cancelled)
            .Sum(b => b.TotalAmount);
        var totalBookings     = bookings.Count;
        var bookingsToday     = bookings.Count(b => b.BookingDate == today);
        var pendingBookings   = bookings.Count(b => b.Status == BookingStatus.Pending);

        var courts  = await uow.Courts.FindAsync(c => c.Branch.PartnerId == partnerId, ct);
        var branches = await uow.Branches.FindAsync(b => b.PartnerId == partnerId, ct);

        var reviews = await uow.Reviews.Query()
            .Include(r => r.Court).ThenInclude(c => c.Branch)
            .Where(r => r.Court.Branch.PartnerId == partnerId)
            .ToListAsync(ct);
        var avgRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

        var staffCount = await uow.PartnerUserRoles.CountAsync(
            r => r.PartnerId == partnerId && r.IsActive
              && (r.Role.Code == Roles.Staff || r.Role.Code == Roles.BranchManager), ct);

        // Revenue chart
        var since30 = today.AddDays(-29);
        var revenueChart = bookings
            .Where(b => b.BookingDate >= since30 && b.Status != BookingStatus.Cancelled)
            .GroupBy(b => b.BookingDate)
            .Select(g => new RevenueByDay(g.Key, g.Sum(b => b.TotalAmount), g.Count()))
            .OrderBy(r => r.Date)
            .ToList();

        // Branch summary
        var branchSummaries = branches.Select(br =>
        {
            var branchBookings = bookings.Where(b => b.Court.BranchId == br.BranchId).ToList();
            return new BranchSummary(
                br.BranchId, br.Name,
                courts.Count(c => c.BranchId == br.BranchId),
                branchBookings.Count(b => b.BookingDate == today),
                branchBookings.Where(b => b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount));
        }).ToList();

        var totalCourts = courts.Count;
        var occupancy = totalCourts > 0
            ? Math.Round((double)bookingsToday / (totalCourts * 16) * 100, 1) // assume 16 slots/day
            : 0;

        return new PartnerAdminDashboard(
            totalRevenue, revenueThisMonth, totalBookings, bookingsToday, pendingBookings,
            occupancy, Math.Round(avgRating, 1), reviews.Count,
            branches.Count, totalCourts, staffCount,
            revenueChart, branchSummaries);
    }

    public async Task<BranchManagerDashboard> GetBranchManagerAsync(Guid branchId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var bookings = await uow.Bookings.Query()
            .Include(b => b.Court).Include(b => b.Customer)
            .Where(b => b.Court.BranchId == branchId)
            .ToListAsync(ct);

        var courts = await uow.Courts.FindAsync(c => c.BranchId == branchId, ct);
        var reviews = await uow.Reviews.Query()
            .Include(r => r.Court).Where(r => r.Court.BranchId == branchId).ToListAsync(ct);

        var revenueToday     = bookings.Where(b => b.BookingDate == today && b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount);
        var revenueMonth     = bookings.Where(b => b.BookingDate.Month == today.Month && b.Status != BookingStatus.Cancelled).Sum(b => b.TotalAmount);
        var todayBookings    = bookings.Count(b => b.BookingDate == today);
        var pending          = bookings.Count(b => b.Status == BookingStatus.Pending);
        var confirmed        = bookings.Count(b => b.Status == BookingStatus.Confirmed);
        var checkedIn        = bookings.Count(b => b.Status == BookingStatus.CheckedIn && b.BookingDate == today);
        var avgRating        = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;
        var occupancy        = courts.Count > 0 ? Math.Round((double)todayBookings / (courts.Count * 16) * 100, 1) : 0;

        var courtStatuses = courts.Select(c => new CourtStatusItem(
            c.CourtId, c.Name, c.Status.ToString(),
            bookings.Any(b => b.CourtId == c.CourtId && b.BookingDate == today && b.Status == BookingStatus.CheckedIn)
        )).ToList();

        var upcoming = bookings
            .Where(b => b.BookingDate == today && b.Status is BookingStatus.Confirmed or BookingStatus.Pending)
            .OrderBy(b => b.StartTime)
            .Take(10)
            .Select(b => new UpcomingBooking(b.BookingId, b.Court.Name, b.Customer.FullName, b.StartTime, b.EndTime, b.Status.ToString()))
            .ToList();

        return new BranchManagerDashboard(
            revenueToday, revenueMonth, todayBookings, pending, confirmed, checkedIn,
            occupancy, Math.Round(avgRating, 1), courtStatuses, upcoming);
    }

    // ── Revenue Report: SuperAdmin ────────────────────────────────────────

    public async Task<RevenueReport> GetRevenueReportAsync(CancellationToken ct = default)
    {
        var today    = DateOnly.FromDateTime(DateTime.UtcNow);
        var since30  = today.AddDays(-29).ToDateTime(TimeOnly.MinValue);

        var totalPartners = await uow.Partners.CountAsync(p => p.Status == PartnerStatus.Active, ct);
        var totalBranches = await uow.Branches.CountAsync(b => b.Status == BranchStatus.Active, ct);
        var totalCourts   = await uow.Courts.CountAsync(c => c.Status == CourtStatus.Active, ct);
        var totalBookings = await uow.Bookings.CountAsync(null, ct);

        var payments = await uow.Payments.Query()
            .Where(p => p.Status == PaymentStatus.Success)
            .Select(p => new { p.PaidAt, p.Amount })
            .ToListAsync(ct);

        var totalRevenue     = payments.Sum(p => p.Amount);
        var commissionEarned = await uow.CommissionLedger.Query().SumAsync(c => c.CommissionAmt, ct);

        var revenueChart = payments
            .Where(p => p.PaidAt.HasValue && p.PaidAt.Value >= since30)
            .GroupBy(p => DateOnly.FromDateTime(p.PaidAt!.Value))
            .Select(g => new RevenueByDay(g.Key, g.Sum(p => p.Amount), g.Count()))
            .OrderBy(r => r.Date)
            .ToList();

        // Revenue breakdown per partner
        var ledgerRows = await uow.CommissionLedger.Query()
            .Select(c => new {
                c.PartnerId,
                PartnerName    = c.Partner.Name,
                c.GrossAmount,
                c.CommissionAmt,
                c.NetAmount,
            })
            .ToListAsync(ct);

        // EF Core auto-joins via navigation property — no explicit Include needed in GroupBy
        var partnerBookingCounts = await uow.Bookings.Query()
            .GroupBy(b => b.Court.Branch.PartnerId)
            .Select(g => new { PartnerId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var partnerBranchCounts = await uow.Branches.Query()
            .GroupBy(b => b.PartnerId)
            .Select(g => new { PartnerId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var partnerCourtCounts = await uow.Courts.Query()
            .GroupBy(c => c.Branch.PartnerId)
            .Select(g => new { PartnerId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var revenueByPartner = ledgerRows
            .GroupBy(r => new { r.PartnerId, r.PartnerName })
            .Select(g => new PartnerRevenueItem(
                g.Key.PartnerId,
                g.Key.PartnerName,
                g.Sum(r => r.GrossAmount),
                g.Sum(r => r.CommissionAmt),
                g.Sum(r => r.NetAmount),
                partnerBookingCounts.FirstOrDefault(x => x.PartnerId == g.Key.PartnerId)?.Count ?? 0,
                partnerBranchCounts.FirstOrDefault(x => x.PartnerId == g.Key.PartnerId)?.Count ?? 0,
                partnerCourtCounts.FirstOrDefault(x => x.PartnerId == g.Key.PartnerId)?.Count ?? 0))
            .OrderByDescending(x => x.GrossRevenue)
            .ToList();

        return new RevenueReport(
            totalRevenue, commissionEarned,
            totalBookings, totalPartners, totalBranches, totalCourts,
            revenueChart, revenueByPartner);
    }

    // ── Revenue Report: PartnerAdmin ──────────────────────────────────────

    public async Task<PartnerRevenueReport> GetPartnerRevenueReportAsync(
        Guid partnerId, CancellationToken ct = default)
    {
        var today        = DateOnly.FromDateTime(DateTime.UtcNow);
        var since30      = today.AddDays(-29);

        var partner = await uow.Partners.GetByIdAsync(partnerId, ct);

        var bookings = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch)
            .Where(b => b.Court.Branch.PartnerId == partnerId)
            .Select(b => new {
                b.BookingId, b.BookingDate, b.TotalAmount, b.Status, b.Court.BranchId, b.Court.Branch.Name
            })
            .ToListAsync(ct);

        var successStatuses = new[] { BookingStatus.Confirmed, BookingStatus.CheckedIn, BookingStatus.CheckedOut };

        var totalRevenue     = bookings.Where(b => successStatuses.Contains(b.Status)).Sum(b => b.TotalAmount);
        var revenueThisMonth = bookings
            .Where(b => successStatuses.Contains(b.Status)
                     && b.BookingDate.Month == today.Month && b.BookingDate.Year == today.Year)
            .Sum(b => b.TotalAmount);

        var totalBookings     = bookings.Count;
        var bookingsThisMonth = bookings.Count(b => b.BookingDate.Month == today.Month && b.BookingDate.Year == today.Year);

        var branches = await uow.Branches.FindAsync(b => b.PartnerId == partnerId, ct);
        var courts   = await uow.Courts.FindAsync(c => c.Branch.PartnerId == partnerId, ct);

        var revenueChart = bookings
            .Where(b => successStatuses.Contains(b.Status) && b.BookingDate >= since30)
            .GroupBy(b => b.BookingDate)
            .Select(g => new RevenueByDay(g.Key, g.Sum(b => b.TotalAmount), g.Count()))
            .OrderBy(r => r.Date)
            .ToList();

        var branchBreakdown = branches.Select(br =>
        {
            var branchBookings = bookings.Where(b => b.BranchId == br.BranchId).ToList();
            return new BranchSummary(
                br.BranchId,
                br.Name,
                courts.Count(c => c.BranchId == br.BranchId),
                branchBookings.Count(b => b.BookingDate == today),
                branchBookings.Where(b => successStatuses.Contains(b.Status)).Sum(b => b.TotalAmount));
        }).ToList();

        return new PartnerRevenueReport(
            partnerId,
            partner?.Name ?? "",
            totalRevenue, revenueThisMonth,
            totalBookings, bookingsThisMonth,
            branches.Count, courts.Count,
            revenueChart, branchBreakdown);
    }

    public async Task<StaffDashboard> GetStaffAsync(Guid branchId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var bookings = await uow.Bookings.Query()
            .Include(b => b.Court).Include(b => b.Customer)
            .Where(b => b.Court.BranchId == branchId && b.BookingDate == today)
            .ToListAsync(ct);

        var courts = await uow.Courts.FindAsync(c => c.BranchId == branchId, ct);

        var courtStatuses = courts.Select(c => new CourtStatusItem(
            c.CourtId, c.Name, c.Status.ToString(),
            bookings.Any(b => b.CourtId == c.CourtId && b.Status == BookingStatus.CheckedIn)
        )).ToList();

        var upcoming = bookings
            .Where(b => b.Status is BookingStatus.Confirmed or BookingStatus.Pending)
            .OrderBy(b => b.StartTime)
            .Take(10)
            .Select(b => new UpcomingBooking(b.BookingId, b.Court.Name, b.Customer.FullName, b.StartTime, b.EndTime, b.Status.ToString()))
            .ToList();

        return new StaffDashboard(
            bookings.Count(b => b.Status == BookingStatus.Pending),
            bookings.Count(b => b.Status == BookingStatus.Confirmed),
            bookings.Count(b => b.Status == BookingStatus.CheckedIn),
            courtStatuses, upcoming);
    }
}
