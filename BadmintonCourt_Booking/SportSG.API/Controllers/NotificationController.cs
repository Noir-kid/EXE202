using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Application.Interfaces;
using SportSG.Domain.Entities;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController(IUnitOfWork uow, INotificationHub hub) : ControllerBase
{
    /// <summary>Lấy danh sách thông báo của tôi (tối đa 50 mới nhất).</summary>
    [HttpGet]
    public async Task<IActionResult> GetMine(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var userId = HttpContext.GetUserId();

        var q = uow.Notifications.Query().Where(n => n.UserId == userId);
        if (unreadOnly) q = q.Where(n => !n.IsRead);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new {
                n.NotificationId, n.Title, n.Message,
                Type     = n.Type.ToString(),
                n.RefType, n.RefId,
                n.IsRead, n.CreatedAt,
            })
            .ToListAsync(ct);

        var unreadCount = await uow.Notifications.CountAsync(
            n => n.UserId == userId && !n.IsRead, ct);

        return Ok(new { items, total, unreadCount, page, pageSize });
    }

    /// <summary>Đánh dấu một thông báo là đã đọc.</summary>
    [HttpPatch("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        var notif = await uow.Notifications.FirstOrDefaultAsync(
            n => n.NotificationId == id && n.UserId == HttpContext.GetUserId(), ct);

        if (notif is null) return NotFound();

        if (!notif.IsRead)
        {
            notif.IsRead = true;
            uow.Notifications.Update(notif);
            await uow.SaveChangesAsync(ct);
        }

        return NoContent();
    }

    /// <summary>Đánh dấu tất cả thông báo là đã đọc.</summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        var unread = await uow.Notifications.FindAsync(
            n => n.UserId == userId && !n.IsRead, ct);

        if (unread.Count == 0) return NoContent();

        foreach (var n in unread) n.IsRead = true;
        uow.Notifications.UpdateRange(unread);
        await uow.SaveChangesAsync(ct);

        return NoContent();
    }

    /// <summary>Xóa một thông báo.</summary>
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var notif = await uow.Notifications.FirstOrDefaultAsync(
            n => n.NotificationId == id && n.UserId == HttpContext.GetUserId(), ct);

        if (notif is null) return NotFound();

        uow.Notifications.Remove(notif);
        await uow.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// [Staff/Manager] Gửi thông báo tùy chỉnh đến một user.
    /// Dùng cho thông báo khẩn cấp từ quản lý.
    /// </summary>
    [HttpPost("send")]
    [Authorize(Roles = $"{SportSG.Domain.Enums.Roles.SuperAdmin},{SportSG.Domain.Enums.Roles.PartnerAdmin},{SportSG.Domain.Enums.Roles.BranchManager}")]
    public async Task<IActionResult> Send([FromBody] SendNotificationRequest req, CancellationToken ct)
    {
        var notification = new Notification
        {
            UserId  = req.UserId,
            Title   = req.Title,
            Message = req.Message,
            Type    = SportSG.Domain.Enums.NotificationType.Info,
            RefType = req.RefType,
            RefId   = req.RefId,
        };

        await uow.Notifications.AddAsync(notification, ct);
        await uow.SaveChangesAsync(ct);

        // Real-time push via SignalR
        await hub.SendToUserAsync(req.UserId, "notification", new
        {
            notification.NotificationId,
            notification.Title,
            notification.Message,
            Type = notification.Type.ToString(),
        }, ct);

        return Ok(new { notification.NotificationId });
    }

    /// <summary>
    /// [SuperAdmin] Gửi thông báo tới nhiều user cùng lúc (theo vai trò, mặc định Customer).
    /// </summary>
    [HttpPost("broadcast")]
    [Authorize(Roles = SportSG.Domain.Enums.Roles.SuperAdmin)]
    public async Task<IActionResult> Broadcast([FromBody] BroadcastNotificationRequest req, CancellationToken ct)
    {
        var roleCode = req.Role ?? SportSG.Domain.Enums.Roles.Customer;

        List<Guid> userIds;
        if (roleCode == SportSG.Domain.Enums.Roles.Customer)
        {
            userIds = await uow.Users.Query()
                .Where(u => !uow.PartnerUserRoles.Query().Any(p => p.UserId == u.UserId))
                .Select(u => u.UserId)
                .ToListAsync(ct);
        }
        else
        {
            userIds = await uow.PartnerUserRoles.Query()
                .Where(p => p.Role.Code == roleCode)
                .Select(p => p.UserId)
                .Distinct()
                .ToListAsync(ct);
        }

        if (userIds.Count == 0) return Ok(new { sentCount = 0 });

        var notifications = userIds.Select(uid => new Notification
        {
            UserId  = uid,
            Title   = req.Title,
            Message = req.Message,
            Type    = SportSG.Domain.Enums.NotificationType.Info,
            RefType = "Broadcast",
        }).ToList();

        await uow.Notifications.AddRangeAsync(notifications, ct);
        await uow.SaveChangesAsync(ct);

        foreach (var uid in userIds)
        {
            await hub.SendToUserAsync(uid, "notification", new { req.Title, req.Message, Type = "Info" }, ct);
        }

        return Ok(new { sentCount = userIds.Count });
    }

    /// <summary>
    /// [Staff/Manager] Lịch sử thông báo đã gửi (tất cả notification hiện đều do admin/staff gửi thủ công).
    /// </summary>
    [HttpGet("sent")]
    [Authorize(Roles = $"{SportSG.Domain.Enums.Roles.SuperAdmin},{SportSG.Domain.Enums.Roles.PartnerAdmin},{SportSG.Domain.Enums.Roles.BranchManager}")]
    public async Task<IActionResult> GetSent(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var q = uow.Notifications.Query().Include(n => n.User).OrderByDescending(n => n.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new {
                n.NotificationId, n.Title, n.Message, n.RefType,
                n.IsRead, n.CreatedAt,
                RecipientEmail = n.User.Email,
                RecipientName  = n.User.FirstName + " " + n.User.LastName,
            })
            .ToListAsync(ct);

        return Ok(new { items, total, page, pageSize });
    }
}

public record SendNotificationRequest(
    Guid    UserId,
    string  Title,
    string  Message,
    string? RefType = null,
    Guid?   RefId   = null
);

public record BroadcastNotificationRequest(
    string  Title,
    string  Message,
    string? Role = null
);
