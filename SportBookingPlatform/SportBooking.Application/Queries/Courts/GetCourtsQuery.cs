using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Court;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Queries.Courts;

public record GetCourtsQuery(CourtListQuery Filter) : IRequest<Result<PagedResult<CourtResponse>>>;

public class GetCourtsQueryHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetCourtsQuery, Result<PagedResult<CourtResponse>>>
{
    public async Task<Result<PagedResult<CourtResponse>>> Handle(GetCourtsQuery req, CancellationToken ct)
    {
        var f = req.Filter;
        var q = uow.Courts.Query()
            .Include(c => c.Branch).ThenInclude(b => b.Owner)
            .Where(c => !c.IsDeleted);

        // Tenant isolation
        if (currentUser.IsOwner)
            q = q.Where(c => c.OwnerId == currentUser.OwnerId);
        else if (currentUser.IsStaff)
            q = q.Where(c => c.BranchId == currentUser.BranchId);

        if (f.BranchId.HasValue) q = q.Where(c => c.BranchId == f.BranchId.Value);
        if (f.OwnerId.HasValue) q = q.Where(c => c.OwnerId == f.OwnerId.Value);
        if (f.SportType.HasValue) q = q.Where(c => c.SportType == f.SportType.Value);
        if (f.Status.HasValue) q = q.Where(c => c.Status == f.Status.Value);

        var total = await q.CountAsync(ct);
        var courts = await q
            .OrderBy(c => c.Name)
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync(ct);

        // Fetch ratings in bulk
        var courtIds = courts.Select(c => c.Id).ToList();
        var reviews = await uow.Reviews.FindAsync(r => courtIds.Contains(r.CourtId), ct);
        var ratingMap = reviews.GroupBy(r => r.CourtId)
            .ToDictionary(g => g.Key, g => (avg: g.Average(r => r.Rating), count: g.Count()));

        var items = courts.Select(c =>
        {
            var (avg, count) = ratingMap.TryGetValue(c.Id, out var r) ? r : (0, 0);
            return new CourtResponse(
                c.Id, c.BranchId, c.Branch.Name, c.OwnerId, c.Branch.Owner.Name,
                c.Name, c.SportType, c.SportType.ToString(), c.Status,
                c.PricePerHour, c.PeakHourMultiplier, c.PeakHourStart, c.PeakHourEnd,
                c.Description, c.ImageUrl, avg, count);
        }).ToList();

        return Result<PagedResult<CourtResponse>>.Success(
            PagedResult<CourtResponse>.Create(items, total, f.Page, f.PageSize));
    }
}

public record GetCourtByIdQuery(Guid CourtId) : IRequest<Result<CourtResponse>>;

public class GetCourtByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetCourtByIdQuery, Result<CourtResponse>>
{
    public async Task<Result<CourtResponse>> Handle(GetCourtByIdQuery req, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch).ThenInclude(b => b.Owner)
            .FirstOrDefaultAsync(c => c.Id == req.CourtId && !c.IsDeleted, ct);

        if (court is null) return Result<CourtResponse>.NotFound("Court not found.");

        var reviews = await uow.Reviews.FindAsync(r => r.CourtId == court.Id && r.IsVisible, ct);
        var avg = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

        return Result<CourtResponse>.Success(new CourtResponse(
            court.Id, court.BranchId, court.Branch.Name, court.OwnerId, court.Branch.Owner.Name,
            court.Name, court.SportType, court.SportType.ToString(), court.Status,
            court.PricePerHour, court.PeakHourMultiplier, court.PeakHourStart, court.PeakHourEnd,
            court.Description, court.ImageUrl, avg, reviews.Count));
    }
}