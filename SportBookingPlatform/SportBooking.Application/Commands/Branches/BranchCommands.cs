using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Branch;
using SportBooking.Domain.Entities;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Commands.Branches;

// ── CREATE ──────────────────────────────────────────────────────────────────
public record CreateBranchCommand(
    string Name, string Address, string? City, string? District,
    string? Phone, string? Description, string? ImageUrl,
    string OpenTime, string CloseTime
) : IRequest<Result<BranchResponse>>;

public class CreateBranchCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<CreateBranchCommand, Result<BranchResponse>>
{
    public async Task<Result<BranchResponse>> Handle(CreateBranchCommand cmd, CancellationToken ct)
    {
        if (!currentUser.OwnerId.HasValue)
            return Result<BranchResponse>.Forbidden("Only owners can create branches.");

        var owner = await uow.Owners.GetByIdAsync(currentUser.OwnerId.Value, ct);
        if (owner is null) return Result<BranchResponse>.NotFound("Owner account not found.");

        var branch = new Branch
        {
            OwnerId = currentUser.OwnerId.Value,
            Name = cmd.Name,
            Address = cmd.Address,
            City = cmd.City,
            District = cmd.District,
            Phone = cmd.Phone,
            Description = cmd.Description,
            ImageUrl = cmd.ImageUrl,
            OpenTime = cmd.OpenTime,
            CloseTime = cmd.CloseTime
        };

        await uow.Branches.AddAsync(branch, ct);
        await uow.SaveChangesAsync(ct);

        return Result<BranchResponse>.Success(MapToResponse(branch, owner.Name, 0), 201);
    }

    private static BranchResponse MapToResponse(Branch b, string ownerName, int courtCount) =>
        new(b.Id, b.OwnerId, ownerName, b.Name, b.Address, b.City, b.District,
            b.Phone, b.Description, b.ImageUrl, b.OpenTime, b.CloseTime, b.Status, courtCount, b.CreatedAt);
}

// ── UPDATE ──────────────────────────────────────────────────────────────────
public record UpdateBranchCommand(
    Guid BranchId, string? Name, string? Address, string? City, string? District,
    string? Phone, string? Description, string? ImageUrl,
    string? OpenTime, string? CloseTime, BranchStatus? Status
) : IRequest<Result<BranchResponse>>;

public class UpdateBranchCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<UpdateBranchCommand, Result<BranchResponse>>
{
    public async Task<Result<BranchResponse>> Handle(UpdateBranchCommand cmd, CancellationToken ct)
    {
        var branch = await uow.Branches.Query()
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Id == cmd.BranchId && !b.IsDeleted, ct);

        if (branch is null) return Result<BranchResponse>.NotFound("Branch not found.");

        if (currentUser.IsOwner && branch.OwnerId != currentUser.OwnerId)
            return Result<BranchResponse>.Forbidden();

        if (cmd.Name is not null) branch.Name = cmd.Name;
        if (cmd.Address is not null) branch.Address = cmd.Address;
        if (cmd.City is not null) branch.City = cmd.City;
        if (cmd.District is not null) branch.District = cmd.District;
        if (cmd.Phone is not null) branch.Phone = cmd.Phone;
        if (cmd.Description is not null) branch.Description = cmd.Description;
        if (cmd.ImageUrl is not null) branch.ImageUrl = cmd.ImageUrl;
        if (cmd.OpenTime is not null) branch.OpenTime = cmd.OpenTime;
        if (cmd.CloseTime is not null) branch.CloseTime = cmd.CloseTime;
        if (cmd.Status.HasValue) branch.Status = cmd.Status.Value;
        branch.UpdatedAt = DateTime.UtcNow;

        uow.Branches.Update(branch);
        await uow.SaveChangesAsync(ct);

        var courtCount = await uow.Courts.CountAsync(c => c.BranchId == branch.Id && !c.IsDeleted, ct);
        return Result<BranchResponse>.Success(new BranchResponse(
            branch.Id, branch.OwnerId, branch.Owner.Name, branch.Name, branch.Address,
            branch.City, branch.District, branch.Phone, branch.Description, branch.ImageUrl,
            branch.OpenTime, branch.CloseTime, branch.Status, courtCount, branch.CreatedAt));
    }
}

// ── DELETE ──────────────────────────────────────────────────────────────────
public record DeleteBranchCommand(Guid BranchId) : IRequest<Result>;

public class DeleteBranchCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<DeleteBranchCommand, Result>
{
    public async Task<Result> Handle(DeleteBranchCommand cmd, CancellationToken ct)
    {
        var branch = await uow.Branches.GetByIdAsync(cmd.BranchId, ct);
        if (branch is null) return Result.NotFound("Branch not found.");

        if (currentUser.IsOwner && branch.OwnerId != currentUser.OwnerId)
            return Result.Failure("Access denied.", 403);

        uow.Branches.SoftDelete(branch);
        await uow.SaveChangesAsync(ct);
        return Result.Success(204);
    }
}