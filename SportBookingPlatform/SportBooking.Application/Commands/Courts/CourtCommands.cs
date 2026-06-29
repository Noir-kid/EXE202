using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Court;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Courts;

// ── CREATE ──────────────────────────────────────────────────────────────────
public record CreateCourtCommand(
    Guid BranchId, string Name, SportType SportType, decimal PricePerHour,
    string? Description, string? ImageUrl,
    decimal PeakHourMultiplier, string? PeakHourStart, string? PeakHourEnd
) : IRequest<Result<CourtResponse>>;

public class CreateCourtCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<CreateCourtCommand, Result<CourtResponse>>
{
    public async Task<Result<CourtResponse>> Handle(CreateCourtCommand cmd, CancellationToken ct)
    {
        var branch = await uow.Branches.Query()
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Id == cmd.BranchId && !b.IsDeleted, ct);

        if (branch is null) return Result<CourtResponse>.NotFound("Branch not found.");

        // Owner can only create courts in their own branches
        if (currentUser.IsOwner && branch.OwnerId != currentUser.OwnerId)
            return Result<CourtResponse>.Forbidden();

        var court = new Court
        {
            BranchId = cmd.BranchId,
            OwnerId = branch.OwnerId,
            Name = cmd.Name,
            SportType = cmd.SportType,
            PricePerHour = cmd.PricePerHour,
            Description = cmd.Description,
            ImageUrl = cmd.ImageUrl,
            PeakHourMultiplier = cmd.PeakHourMultiplier,
            PeakHourStart = cmd.PeakHourStart,
            PeakHourEnd = cmd.PeakHourEnd
        };

        await uow.Courts.AddAsync(court, ct);
        await uow.SaveChangesAsync(ct);

        return Result<CourtResponse>.Success(MapToResponse(court, branch), 201);
    }

    private static CourtResponse MapToResponse(Court c, Branch branch) =>
        new(c.Id, c.BranchId, branch.Name, c.OwnerId, branch.Owner.Name,
            c.Name, c.SportType, c.SportType.ToString(), c.Status,
            c.PricePerHour, c.PeakHourMultiplier, c.PeakHourStart, c.PeakHourEnd,
            c.Description, c.ImageUrl, 0, 0);
}

// ── UPDATE ──────────────────────────────────────────────────────────────────
public record UpdateCourtCommand(
    Guid CourtId, string? Name, decimal? PricePerHour, string? Description,
    string? ImageUrl, CourtStatus? Status,
    decimal? PeakHourMultiplier, string? PeakHourStart, string? PeakHourEnd
) : IRequest<Result<CourtResponse>>;

public class UpdateCourtCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<UpdateCourtCommand, Result<CourtResponse>>
{
    public async Task<Result<CourtResponse>> Handle(UpdateCourtCommand cmd, CancellationToken ct)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch).ThenInclude(b => b.Owner)
            .FirstOrDefaultAsync(c => c.Id == cmd.CourtId && !c.IsDeleted, ct);

        if (court is null) return Result<CourtResponse>.NotFound("Court not found.");

        if (currentUser.IsOwner && court.OwnerId != currentUser.OwnerId)
            return Result<CourtResponse>.Forbidden();

        if (cmd.Name is not null) court.Name = cmd.Name;
        if (cmd.PricePerHour.HasValue) court.PricePerHour = cmd.PricePerHour.Value;
        if (cmd.Description is not null) court.Description = cmd.Description;
        if (cmd.ImageUrl is not null) court.ImageUrl = cmd.ImageUrl;
        if (cmd.Status.HasValue) court.Status = cmd.Status.Value;
        if (cmd.PeakHourMultiplier.HasValue) court.PeakHourMultiplier = cmd.PeakHourMultiplier.Value;
        if (cmd.PeakHourStart is not null) court.PeakHourStart = cmd.PeakHourStart;
        if (cmd.PeakHourEnd is not null) court.PeakHourEnd = cmd.PeakHourEnd;
        court.UpdatedAt = DateTime.UtcNow;

        uow.Courts.Update(court);
        await uow.SaveChangesAsync(ct);

        var reviews = await uow.Reviews.FindAsync(r => r.CourtId == court.Id, ct);
        var avgRating = reviews.Count > 0 ? reviews.Average(r => r.Rating) : 0;

        return Result<CourtResponse>.Success(new CourtResponse(
            court.Id, court.BranchId, court.Branch.Name, court.OwnerId, court.Branch.Owner.Name,
            court.Name, court.SportType, court.SportType.ToString(), court.Status,
            court.PricePerHour, court.PeakHourMultiplier, court.PeakHourStart, court.PeakHourEnd,
            court.Description, court.ImageUrl, avgRating, reviews.Count));
    }
}

// ── DELETE ──────────────────────────────────────────────────────────────────
public record DeleteCourtCommand(Guid CourtId) : IRequest<Result>;

public class DeleteCourtCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<DeleteCourtCommand, Result>
{
    public async Task<Result> Handle(DeleteCourtCommand cmd, CancellationToken ct)
    {
        var court = await uow.Courts.GetByIdAsync(cmd.CourtId, ct);
        if (court is null) return Result.NotFound("Court not found.");

        if (currentUser.IsOwner && court.OwnerId != currentUser.OwnerId)
            return Result.Failure("Access denied.", 403);

        uow.Courts.SoftDelete(court);
        await uow.SaveChangesAsync(ct);
        return Result.Success(204);
    }
}