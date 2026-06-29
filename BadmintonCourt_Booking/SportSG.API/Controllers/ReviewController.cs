using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SportSG.API.Extensions;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.API.Controllers;

[ApiController]
[Route("api/reviews")]
[Authorize]
public class ReviewController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var role      = HttpContext.GetRole();
        var userId    = HttpContext.GetUserId();
        var partnerId = HttpContext.GetPartnerId();
        var branchId  = HttpContext.GetBranchId();

        var q = uow.Reviews.Query()
            .Include(r => r.User)
            .Include(r => r.Court).ThenInclude(c => c.Branch)
            .AsQueryable();

        q = role switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(r => r.Court.Branch.PartnerId == partnerId),
            Roles.BranchManager => q.Where(r => r.Court.BranchId == branchId),
            Roles.Staff         => q.Where(r => r.Court.BranchId == branchId),
            Roles.Customer      => q.Where(r => r.UserId == userId),
            _ => q.Where(r => r.IsVisible)
        };

        var items = await q
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.ReviewId, r.Rating, r.Comment, r.IsVisible, r.CreatedAt,
                UserName   = r.User.FirstName + " " + r.User.LastName,
                UserAvatar = r.User.AvatarUrl,
                CourtName  = r.Court.Name,
                BranchName = r.Court.Branch.Name,
                r.CourtId,
            }).ToListAsync(ct);

        return Ok(items);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest req, CancellationToken ct)
    {
        var userId = HttpContext.GetUserId();
        var booking = await uow.Bookings.Query()
            .Include(b => b.Court)
            .FirstOrDefaultAsync(b => b.BookingId == req.BookingId && b.CustomerId == userId, ct);

        if (booking is null) return BadRequest("Booking không tồn tại hoặc không thuộc về bạn.");

        var review = new Domain.Entities.Review
        {
            BookingId = req.BookingId,
            UserId    = userId,
            CourtId   = booking.CourtId,
            Rating    = (byte)Math.Clamp(req.Rating, 1, 5),
            Comment   = req.Comment,
        };

        await uow.Reviews.AddAsync(review, ct);
        await uow.SaveChangesAsync(ct);
        return Ok(new { review.ReviewId });
    }

    [HttpPatch("{id:guid}/visibility")]
    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.PartnerAdmin},{Roles.BranchManager}")]
    public async Task<IActionResult> ToggleVisibility(Guid id, CancellationToken ct)
    {
        var r = await uow.Reviews.GetByIdAsync(id, ct);
        if (r is null) return NotFound();
        r.IsVisible = !r.IsVisible;
        uow.Reviews.Update(r);
        await uow.SaveChangesAsync(ct);
        return Ok(new { r.IsVisible });
    }
}

public record CreateReviewRequest(Guid BookingId, int Rating, string? Comment);
