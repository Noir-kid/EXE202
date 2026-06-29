using System.Text.Json;
using StackExchange.Redis;
using SportSG.Application.Interfaces;

namespace SportSG.Infrastructure.Services;

public class RedisCacheService(IConnectionMultiplexer redis) : ICacheService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var val = await _db.StringGetAsync(key);
        return val.HasValue ? JsonSerializer.Deserialize<T>(val!) : default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, json, expiry ?? TimeSpan.FromMinutes(5));
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
        => await _db.KeyDeleteAsync(key);

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        var server = redis.GetServers().FirstOrDefault();
        if (server is null) return;
        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Length > 0)
            await _db.KeyDeleteAsync(keys);
    }
}
