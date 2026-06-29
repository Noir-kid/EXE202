using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Branch;

namespace SportBooking.Application.Queries.Branches;

public record GetBranchesQuery(BranchListQuery Filter) : IRequest<Result<PagedResult<BranchResponse>>>;

public class GetBranchesQueryHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetBranchesQuery, Result<PagedResult<BranchResponse>>>
{
    public async Task<Result<PagedResult<BranchResponse>>> Handle(GetBranchesQuery req, CancellationToken ct)
    {
        var f = req.Filter;
        var q = uow.Branches.Query()
            .Include(b => b.Owner)
            .Where(b => !b.IsDeleted);

        if (currentUser.IsOwner)
            q = q.Where(b => b.OwnerId == currentUser.OwnerId);
        else if (currentUser.IsStaff)
            q = q.Where(b => b.Id == currentUser.BranchId);

        if (f.OwnerId.HasValue) q = q.Where(b => b.OwnerId == f.OwnerId.Value);
        if (f.Status.HasValue) q = q.Where(b => b.Status == f.Status.Value);
        if (f.City is not null) q = q.Where(b => b.City == f.City);

        var total = await q.CountAsync(ct);
        var branches = await q
            .OrderBy(b => b.Name)
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .ToListAsync(ct);

        var branchIds = branches.Select(b => b.Id).ToList();
        var courtCounts = await uow.Courts.Query()
            .Where(c => branchIds.Contains(c.BranchId) && !c.IsDeleted)
            .GroupBy(c => c.BranchId)
            .Select(g => new { BranchId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.BranchId, x => x.Count, ct);

        var items = branches.Select(b =>
        {
            var count = courtCounts.TryGetValue(b.Id, out var c) ? c : 0;
            return new BranchResponse(
                b.Id, b.OwnerId, b.Owner.Name, b.Name, b.Address,
                b.City, b.District, b.Phone, b.Description, b.ImageUrl,
                b.OpenTime, b.CloseTime, b.Status, count, b.CreatedAt);
        }).ToList();

        return Result<PagedResult<BranchResponse>>.Success(
            PagedResult<BranchResponse>.Create(items, total, f.Page, f.PageSize));
    }
}

public record GetBranchByIdQuery(Guid BranchId) : IRequest<Result<BranchResponse>>;

public class GetBranchByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetBranchByIdQuery, Result<BranchResponse>>
{
    public async Task<Result<BranchResponse>> Handle(GetBranchByIdQuery req, CancellationToken ct)
    {
        var branch = await uow.Branches.Query()
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Id == req.BranchId && !b.IsDeleted, ct);

        if (branch is null) return Result<BranchResponse>.NotFound("Branch not found.");

        var courtCount = await uow.Courts.CountAsync(c => c.BranchId == branch.Id && !c.IsDeleted, ct);
        return Result<BranchResponse>.Success(new BranchResponse(
            branch.Id, branch.OwnerId, branch.Owner.Name, branch.Name, branch.Address,
            branch.City, branch.District, branch.Phone, branch.Description, branch.ImageUrl,
            branch.OpenTime, branch.CloseTime, branch.Status, courtCount, branch.CreatedAt));
    }
}