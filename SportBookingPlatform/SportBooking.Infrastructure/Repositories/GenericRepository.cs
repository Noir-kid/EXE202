using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Domain.Common;
using SportBooking.Infrastructure.Data;

namespace SportBooking.Infrastructure.Repositories;

public class GenericRepository<T>(AppDbContext db) : IRepository<T> where T : BaseEntity
{
    private readonly DbSet<T> _set = db.Set<T>();

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _set.FindAsync([id], ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default) =>
        await _set.ToListAsync(ct);

    public async Task<IReadOnlyList<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await _set.Where(predicate).ToListAsync(ct);

    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await _set.FirstOrDefaultAsync(predicate, ct);

    public async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
        await _set.AnyAsync(predicate, ct);

    public async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null, CancellationToken ct = default) =>
        predicate is null ? await _set.CountAsync(ct) : await _set.CountAsync(predicate, ct);

    public IQueryable<T> Query() => _set.AsQueryable();

    public async Task AddAsync(T entity, CancellationToken ct = default) =>
        await _set.AddAsync(entity, ct);

    public void Update(T entity) => _set.Update(entity);

    public void Remove(T entity) => _set.Remove(entity);

    public void SoftDelete(AuditableEntity entity)
    {
        entity.IsDeleted = true;
        entity.DeletedAt = DateTime.UtcNow;
        db.Entry(entity).State = EntityState.Modified;
    }
}