using Microsoft.EntityFrameworkCore;
using SportSG.Application.Repositories;
using SportSG.Domain.Entities;

namespace SportSG.Application.Services;

public interface IFavoriteService
{
    Task<bool> ToggleAsync(Guid userId, Guid courtId, CancellationToken ct = default);
    Task<List<object>> GetByUserAsync(Guid userId, CancellationToken ct = default);
}

public class FavoriteService(IUnitOfWork uow) : IFavoriteService
{
    public async Task<bool> ToggleAsync(Guid userId, Guid courtId, CancellationToken ct = default)
    {
        var existing = await uow.Favorites.FirstOrDefaultAsync(
            f => f.UserId == userId && f.CourtId == courtId, ct);

        if (existing is not null)
        {
            uow.Favorites.Remove(existing);
            await uow.SaveChangesAsync(ct);
            return false;
        }

        await uow.Favorites.AddAsync(new Favorite { UserId = userId, CourtId = courtId }, ct);
        await uow.SaveChangesAsync(ct);
        return true;
    }

    public async Task<List<object>> GetByUserAsync(Guid userId, CancellationToken ct = default)
    {
        return await uow.Favorites.Query()
            .Where(f => f.UserId == userId)
            .Include(f => f.Court).ThenInclude(c => c.Branch)
            .Include(f => f.Court).ThenInclude(c => c.Images)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => (object)new
            {
                f.FavoriteId,
                f.CourtId,
                CourtName     = f.Court.Name,
                BranchName    = f.Court.Branch.Name,
                BranchAddress = f.Court.Branch.Address,
                BasePrice     = f.Court.BasePrice,
                ImageUrl      = f.Court.Images.Where(i => i.IsPrimary).Select(i => i.Url).FirstOrDefault()
                                ?? f.Court.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                f.CreatedAt,
            })
            .ToListAsync(ct);
    }
}
