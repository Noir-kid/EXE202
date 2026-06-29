namespace SportSG.Application.Interfaces;

public interface INotificationHub
{
    Task SendToUserAsync(Guid userId, string type, object payload, CancellationToken ct = default);
    Task SendToGroupAsync(string group, string type, object payload, CancellationToken ct = default);
    Task SendToAllAsync(string type, object payload, CancellationToken ct = default);
}
