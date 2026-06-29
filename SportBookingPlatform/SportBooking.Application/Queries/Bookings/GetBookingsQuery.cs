using MediatR;
using Microsoft.EntityFrameworkCore;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Application.Common.Models;
using SportBooking.Application.DTOs.Booking;
using SportBooking.Domain.Enums;

namespace SportBooking.Application.Queries.Bookings;

public record GetBookingsQuery(
    Guid? CourtId = null,
    Guid? BranchId = null,
    BookingStatus? Status = null,
    DateOnly? From = null,
    DateOnly? To = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<BookingResponse>>>;

public class GetBookingsQueryHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetBookingsQuery, Result<PagedResult<BookingResponse>>>
{
    public async Task<Result<PagedResult<BookingResponse>>> Handle(GetBookingsQuery query, CancellationToken ct)
    {
        var q = uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch).ThenInclude(br => br.Owner)
            .Include(b => b.Customer)
            .Include(b => b.Payment)
            .Where(b => !b.IsDeleted);

        // Multi-tenant filtering
        if (currentUser.IsCustomer)
            q = q.Where(b => b.CustomerId == currentUser.UserId);
        else if (currentUser.IsOwner)
            q = q.Where(b => b.OwnerId == currentUser.OwnerId);
        else if (currentUser.IsStaff)
            q = q.Where(b => b.BranchId == currentUser.BranchId);
        // Admin sees all

        if (query.CourtId.HasValue) q = q.Where(b => b.CourtId == query.CourtId.Value);
        if (query.BranchId.HasValue) q = q.Where(b => b.BranchId == query.BranchId.Value);
        if (query.Status.HasValue) q = q.Where(b => b.Status == query.Status.Value);
        if (query.From.HasValue) q = q.Where(b => b.BookingDate >= query.From.Value);
        if (query.To.HasValue) q = q.Where(b => b.BookingDate <= query.To.Value);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(b => b.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => MapToResponse(b))
            .ToListAsync(ct);

        return Result<PagedResult<BookingResponse>>.Success(
            PagedResult<BookingResponse>.Create(items, total, query.Page, query.PageSize));
    }

    private static BookingResponse MapToResponse(Domain.Entities.Booking b) =>
        new(b.Id, b.CourtId, b.Court.Name, b.Court.Branch.Name, b.Court.Branch.Owner.Name,
            b.CustomerId, b.Customer.FullName, b.BookingDate, b.StartTime, b.EndTime,
            b.TotalAmount, b.DiscountAmount, b.FinalAmount, b.Status, b.Note, b.CreatedAt,
            b.Payment == null ? null : new PaymentInfo(
                b.Payment.Id, b.Payment.Method, b.Payment.Status, b.Payment.PaidAt));
}