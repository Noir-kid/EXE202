using SportBooking.Domain.Enums;

namespace SportBooking.Application.DTOs.Branch;

public record CreateBranchRequest(
    string Name,
    string Address,
    string? City = null,
    string? District = null,
    string? Phone = null,
    string? Description = null,
    string? ImageUrl = null,
    string OpenTime = "06:00",
    string CloseTime = "22:00"
);

public record UpdateBranchRequest(
    string? Name = null,
    string? Address = null,
    string? City = null,
    string? District = null,
    string? Phone = null,
    string? Description = null,
    string? ImageUrl = null,
    string? OpenTime = null,
    string? CloseTime = null,
    BranchStatus? Status = null
);

public record BranchResponse(
    Guid BranchId,
    Guid OwnerId,
    string OwnerName,
    string Name,
    string Address,
    string? City,
    string? District,
    string? Phone,
    string? Description,
    string? ImageUrl,
    string OpenTime,
    string CloseTime,
    BranchStatus Status,
    int CourtCount,
    DateTime CreatedAt
);

public record BranchListQuery(
    Guid? OwnerId = null,
    BranchStatus? Status = null,
    string? City = null,
    int Page = 1,
    int PageSize = 20
);