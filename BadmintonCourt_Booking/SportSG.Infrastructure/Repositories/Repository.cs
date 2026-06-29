using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SportSG.Application.Repositories;
using SportSG.Infrastructure.Data;

namespace SportSG.Infrastructure.Repositories;

public class Repository<T>(AppDbContext ctx) : IRepository<T> where T : class
{
    protected readonly DbSet<T> _set = ctx.Set<T>();

    public async Task<T?> GetByIdAsync(object id, CancellationToken ct = default)
        => await _set.FindAsync([id], ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await _set.AsNoTracking().ToListAsync(ct);

    public async Task<IReadOnlyList<T>> FindAsync(
        Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _set.AsNoTracking().Where(predicate).ToListAsync(ct);

    public async Task<T?> FirstOrDefaultAsync(
        Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _set.AsNoTracking().FirstOrDefaultAsync(predicate, ct);

    public IQueryable<T> Query() => _set.AsNoTracking();

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await _set.AddAsync(entity, ct);

    public async Task AddRangeAsync(IEnumerable<T> entities, CancellationToken ct = default)
        => await _set.AddRangeAsync(entities, ct);

    public void Update(T entity)     => _set.Update(entity);
    public void UpdateRange(IEnumerable<T> entities) => _set.UpdateRange(entities);
    public void Remove(T entity)     => _set.Remove(entity);
    public void RemoveRange(IEnumerable<T> entities) => _set.RemoveRange(entities);

    public async Task<int> CountAsync(
        Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default)
        => predicate is null
            ? await _set.CountAsync(ct)
            : await _set.CountAsync(predicate, ct);

    public async Task<bool> AnyAsync(
        Expression<Func<T, bool>> predicate, CancellationToken ct = default)
        => await _set.AnyAsync(predicate, ct);
}
