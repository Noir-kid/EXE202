namespace SportBooking.Application.DTOs.Revenue;

public record AdminRevenueResponse(
    decimal TotalGrossRevenue,
    decimal TotalPlatformCommission,
    decimal TotalOwnerPayout,
    int TotalBookings,
    int TotalSuccessfulPayments,
    List<RevenueByOwner> ByOwner,
    List<RevenueByDay> ByDay,
    List<RevenueBySport> BySport
);

public record OwnerRevenueResponse(
    Guid OwnerId,
    string OwnerName,
    decimal GrossRevenue,
    decimal PlatformCommission,
    decimal NetRevenue,
    int TotalBookings,
    List<RevenueByBranch> ByBranch,
    List<RevenueByDay> ByDay,
    List<RevenueBySport> BySport
);

public record RevenueByOwner(
    Guid OwnerId,
    string OwnerName,
    decimal GrossRevenue,
    decimal Commission,
    int Bookings
);

public record RevenueByBranch(
    Guid BranchId,
    string BranchName,
    decimal Revenue,
    int Bookings
);

public record RevenueByDay(DateOnly Date, decimal Revenue, int Bookings);

public record RevenueBySport(string SportType, decimal Revenue, int Bookings);

public record RevenueQueryFilter(
    DateOnly? From = null,
    DateOnly? To = null,
    Guid? BranchId = null
);