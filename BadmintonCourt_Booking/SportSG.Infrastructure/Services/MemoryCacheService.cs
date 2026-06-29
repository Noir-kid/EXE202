using Microsoft.Extensions.Caching.Memory;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

/// <summary>
/// In-process memory cache — used as fallback when Redis is not configured.
/// Does not support RemoveByPrefix (no-op) — use Redis for prefix invalidation.
/// </summary>
public class MemoryCacheService(IMemoryCache cache) : ICacheService
{
    private static readonly TimeSpan _defaultExpiry = TimeSpan.FromMinutes(5);

    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var opts = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? _defaultExpiry
        };
        cache.Set(key, value, opts);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken ct = default)
    {
        cache.Remove(key);
        return Task.CompletedTask;
    }

    // IMemoryCache has no prefix-scan — silently no-op
    public Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
        => Task.CompletedTask;
}
