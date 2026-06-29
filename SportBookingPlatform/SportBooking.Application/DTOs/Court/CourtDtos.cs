using SportBooking.Domain.Enums;

namespace SportBooking.Application.DTOs.Court;

public record CreateCourtRequest(
    Guid BranchId,
    string Name,
    SportType SportType,
    decimal PricePerHour,
    string? Description = null,
    string? ImageUrl = null,
    decimal PeakHourMultiplier = 1.0m,
    string? PeakHourStart = null,
    string? PeakHourEnd = null
);

public record UpdateCourtRequest(
    string? Name = null,
    decimal? PricePerHour = null,
    string? Description = null,
    string? ImageUrl = null,
    CourtStatus? Status = null,
    decimal? PeakHourMultiplier = null,
    string? PeakHourStart = null,
    string? PeakHourEnd = null
);

public record CourtResponse(
    Guid CourtId,
    Guid BranchId,
    string BranchName,
    Guid OwnerId,
    string OwnerName,
    string Name,
    SportType SportType,
    string SportTypeName,
    CourtStatus Status,
    decimal PricePerHour,
    decimal PeakHourMultiplier,
    string? PeakHourStart,
    string? PeakHourEnd,
    string? Description,
    string? ImageUrl,
    double AverageRating,
    int ReviewCount
);

public record CourtListQuery(
    Guid? BranchId = null,
    Guid? OwnerId = null,
    SportType? SportType = null,
    CourtStatus? Status = null,
    int Page = 1,
    int PageSize = 20
);