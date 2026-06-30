namespace SportSG.Application.DTOs.Dashboard;

// ── Super Admin Dashboard ─────────────────────────────────────

public record SuperAdminDashboard(
    int TotalPartners,
    int ActivePartners,
    int PendingPartners,
    int TotalUsers,
    int NewUsersToday,
    decimal TotalRevenue,
    decimal CommissionEarned,
    decimal RevenueToday,
    int TotalBookings,
    int BookingsToday,
    IReadOnlyList<RevenueByDay> RevenueChart,
    IReadOnlyList<BookingsBySport> BookingsBySport,
    IReadOnlyList<TopPartnerItem> TopPartners
);

// ── Partner Admin Dashboard ───────────────────────────────────

public record PartnerAdminDashboard(
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    int TotalBookings,
    int BookingsToday,
    int PendingBookings,
    double OccupancyRate,
    double AverageRating,
    int TotalReviews,
    int TotalBranches,
    int TotalCourts,
    int ActiveStaff,
    IReadOnlyList<RevenueByDay> RevenueChart,
    IReadOnlyList<BranchSummary> BranchSummaries
);

// ── Branch Manager Dashboard ──────────────────────────────────

public record BranchManagerDashboard(
    decimal RevenueToday,
    decimal RevenueThisMonth,
    int BookingsToday,
    int PendingBookings,
    int ConfirmedBookings,
    int CheckedInToday,
    double OccupancyRate,
    double AverageRating,
    IReadOnlyList<CourtStatusItem> CourtStatuses,
    IReadOnlyList<UpcomingBooking> UpcomingBookings
);

// ── Staff Dashboard ────────────────────────────────────────────

public record StaffDashboard(
    int PendingBookings,
    int ConfirmedBookings,
    int CheckedInNow,
    IReadOnlyList<CourtStatusItem> CourtStatuses,
    IReadOnlyList<UpcomingBooking> UpcomingBookings
);

// ── Shared ────────────────────────────────────────────────────

public record RevenueByDay(DateOnly Date, decimal Revenue, int Bookings);
public record BookingsBySport(string SportName, int Count, decimal Revenue);
public record TopPartnerItem(Guid PartnerId, string Name, decimal Revenue, int Bookings);
public record BranchSummary(Guid BranchId, string Name, int Courts, int TodayBookings, decimal Revenue);
public record CourtStatusItem(Guid CourtId, string Name, string Status, bool IsOccupied);
public record UpcomingBooking(Guid BookingId, string CourtName, string CustomerName, TimeOnly StartTime, TimeOnly EndTime, string Status);

// ── Revenue Report ────────────────────────────────────────────────

public record RevenueReport(
    decimal TotalRevenue,
    decimal CommissionEarned,
    int TotalBookings,
    int TotalPartners,
    int TotalBranches,
    int TotalCourts,
    IReadOnlyList<RevenueByDay> RevenueChart,
    IReadOnlyList<PartnerRevenueItem> RevenueByPartner
);

public record PartnerRevenueItem(
    Guid PartnerId,
    string PartnerName,
    decimal GrossRevenue,
    decimal CommissionAmt,
    decimal NetRevenue,
    int Bookings,
    int Branches,
    int Courts
);

public record PartnerRevenueReport(
    Guid PartnerId,
    string PartnerName,
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    int TotalBookings,
    int BookingsThisMonth,
    int TotalBranches,
    int TotalCourts,
    IReadOnlyList<RevenueByDay> RevenueChart,
    IReadOnlyList<BranchSummary> BranchBreakdown
);
