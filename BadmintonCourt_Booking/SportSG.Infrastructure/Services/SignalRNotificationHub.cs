using Microsoft.AspNetCore.SignalR;
using SportSG.Application.Interfaces;
using SportSG.Infrastructure.Hubs;

namespace SportSG.Infrastructure.Services;

public class SignalRNotificationHub(IHubContext<SportSGHub> hub) : INotificationHub
{
    public Task SendToUserAsync(Guid userId, string type, object payload, CancellationToken ct = default)
        => hub.Clients.Group($"user_{userId}").SendAsync("notification", new { type, payload }, ct);

    public Task SendToGroupAsync(string group, string type, object payload, CancellationToken ct = default)
        => hub.Clients.Group(group).SendAsync("notification", new { type, payload }, ct);

    public Task SendToAllAsync(string type, object payload, CancellationToken ct = default)
        => hub.Clients.All.SendAsync("notification", new { type, payload }, ct);
}
