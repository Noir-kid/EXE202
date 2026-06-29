using Microsoft.EntityFrameworkCore;
using SportSG.Application.DTOs.Booking;
using SportSG.Domain.Entities;
using SportSG.Domain.Enums;
using SportSG.Application.Repositories;

namespace SportSG.Application.Services;

public class BookingService(IUnitOfWork uow) : IBookingService
{
    public async Task<BookingResponse> CreateAsync(
        Guid customerId, CreateBookingRequest req, CancellationToken ct = default)
        => await InternalCreateAsync(customerId, req, createdBy: null, ct);

    public async Task<BookingResponse> CreateWalkInAsync(
        Guid staffId, CreateBookingRequest req, CancellationToken ct = default)
        => await InternalCreateAsync(Guid.Empty, req, createdBy: staffId, ct);

    private async Task<BookingResponse> InternalCreateAsync(
        Guid customerId, CreateBookingRequest req, Guid? createdBy, CancellationToken ct)
    {
        // 1. Load court with pricing
        var court = await uow.Courts.Query()
            .Include(c => c.PricingRules)
            .Include(c => c.Branch).ThenInclude(b => b.Partner)
            .FirstOrDefaultAsync(c => c.CourtId == req.CourtId, ct)
            ?? throw new KeyNotFoundException("Sân không tồn tại.");

        if (court.Status != CourtStatus.Active)
            throw new InvalidOperationException("Sân hiện không hoạt động.");

        // 2. Check availability
        var conflict = await uow.Bookings.AnyAsync(b =>
            b.CourtId == req.CourtId
            && b.BookingDate == req.BookingDate
            && b.Status != BookingStatus.Cancelled
            && b.Status != BookingStatus.NoShow
            && b.StartTime < req.EndTime
            && b.EndTime   > req.StartTime, ct);

        if (conflict)
            throw new InvalidOperationException("Khung giờ này đã được đặt.");

        // 3. Check maintenance overlap
        // Tính DateTime trước — EF Core không dịch được DateOnly.ToDateTime() trong LINQ
        var bookingStart = req.BookingDate.ToDateTime(req.StartTime);
        var bookingEnd   = req.BookingDate.ToDateTime(req.EndTime);
        var maintConflict = await uow.Maintenances.AnyAsync(m =>
            m.CourtId == req.CourtId
            && m.Status != "Cancelled"
            && m.StartTime < bookingEnd
            && m.EndTime   > bookingStart, ct);

        if (maintConflict)
            throw new InvalidOperationException("Sân đang trong lịch bảo trì.");

        // 4. Calculate price
        var duration = (int)(req.EndTime - req.StartTime).TotalMinutes;
        var hours    = duration / 60m;
        var price    = court.GetPriceForSlot(req.BookingDate.DayOfWeek, req.StartTime);
        var baseAmt  = Math.Round(price * hours, 2);

        // 5. Apply promotion
        decimal discountAmt = 0;
        Guid? promoId = null;
        if (!string.IsNullOrWhiteSpace(req.PromoCode))
        {
            var promo = await uow.Promotions.FirstOrDefaultAsync(
                p => p.Code == req.PromoCode.ToUpper(), ct);
            if (promo is not null && promo.IsValid(baseAmt, DateTime.UtcNow))
            {
                discountAmt = promo.Calculate(baseAmt);
                promoId     = promo.PromotionId;
                promo.UsageCount++;
                uow.Promotions.Update(promo);
            }
        }

        // 6. Create booking
        var booking = new Booking
        {
            CustomerId      = customerId,
            CourtId         = req.CourtId,
            BookingDate     = req.BookingDate,
            StartTime       = req.StartTime,
            EndTime         = req.EndTime,
            DurationMinutes = duration,
            BaseAmount      = baseAmt,
            DiscountAmount  = discountAmt,
            TotalAmount     = baseAmt - discountAmt,
            Note            = req.Note,
            CreatedBy       = createdBy,
            PromotionId     = promoId,
        };

        await uow.Bookings.AddAsync(booking, ct);
        await uow.SaveChangesAsync(ct);

        return MapToResponse(booking, court);
    }

    public async Task<BookingResponse> GetByIdAsync(
        Guid bookingId, Guid callerId, string callerRole, CancellationToken ct = default)
    {
        var booking = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch).ThenInclude(b => b.Partner)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId, ct)
            ?? throw new KeyNotFoundException("Booking không tồn tại.");

        EnforceReadAccess(booking, callerId, callerRole);
        return MapToResponse(booking, booking.Court);
    }

    public async Task<PagedResult<BookingListItem>> ListAsync(
        BookingFilterRequest f, Guid callerId, string callerRole,
        Guid? callerPartnerId, Guid? callerBranchId, CancellationToken ct = default)
    {
        IQueryable<Booking> q = uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch);

        // ── Multi-Tenant scope enforcement ────────────────────────
        q = callerRole switch
        {
            Roles.SuperAdmin    => q,
            Roles.PartnerAdmin  => q.Where(b => b.Court.Branch.PartnerId == callerPartnerId),
            Roles.BranchManager => q.Where(b => b.Court.BranchId == callerBranchId),
            Roles.Staff         => q.Where(b => b.Court.BranchId == callerBranchId),
            Roles.Customer      => q.Where(b => b.CustomerId == callerId),
            _ => throw new UnauthorizedAccessException()
        };

        // ── Optional filters ──────────────────────────────────────
        if (f.CourtId.HasValue) q = q.Where(b => b.CourtId == f.CourtId);
        if (f.BranchId.HasValue) q = q.Where(b => b.Court.BranchId == f.BranchId);
        if (!string.IsNullOrEmpty(f.Status)) q = q.Where(b => b.Status.ToString() == f.Status);
        if (f.From.HasValue) q = q.Where(b => b.BookingDate >= f.From);
        if (f.To.HasValue)   q = q.Where(b => b.BookingDate <= f.To);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(b => b.BookingDate).ThenBy(b => b.StartTime)
            .Skip((f.Page - 1) * f.PageSize)
            .Take(f.PageSize)
            .Select(b => new BookingListItem(
                b.BookingId, b.Court.Name, b.Court.Branch.Name,
                b.BookingDate, b.StartTime, b.EndTime,
                b.TotalAmount, b.Status.ToString(), b.CreatedAt))
            .ToListAsync(ct);

        return new PagedResult<BookingListItem>(items, total, f.Page, f.PageSize);
    }

    public async Task UpdateStatusAsync(
        UpdateBookingStatusRequest req, Guid callerId, string callerRole, CancellationToken ct = default)
    {
        var booking = await uow.Bookings.Query()
            .Include(b => b.Court).ThenInclude(c => c.Branch)
            .FirstOrDefaultAsync(b => b.BookingId == req.BookingId, ct)
            ?? throw new KeyNotFoundException("Booking không tồn tại.");

        EnforceWriteAccess(booking, callerId, callerRole, req.NewStatus);

        booking.Status      = req.NewStatus;
        booking.CancelReason = req.Reason;
        if (req.NewStatus == BookingStatus.Confirmed) booking.ConfirmedBy = callerId;
        booking.UpdatedAt   = DateTime.UtcNow;

        uow.Bookings.Update(booking);
        await uow.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<TimeOnly>> GetAvailableSlotsAsync(
        Guid courtId, DateOnly date, CancellationToken ct = default)
    {
        var court = await uow.Courts.Query()
            .Include(c => c.Branch)
            .FirstOrDefaultAsync(c => c.CourtId == courtId, ct)
            ?? throw new KeyNotFoundException();

        var bookedSlots = await uow.Bookings.FindAsync(
            b => b.CourtId == courtId
              && b.BookingDate == date
              && b.Status != BookingStatus.Cancelled
              && b.Status != BookingStatus.NoShow, ct);

        var open  = court.Branch.OpenTime  ?? new TimeOnly(6, 0);
        var close = court.Branch.CloseTime ?? new TimeOnly(22, 0);

        var slots = new List<TimeOnly>();
        for (var t = open; t < close; t = t.AddHours(1))
        {
            var slotEnd = t.AddHours(1);
            var isBooked = bookedSlots.Any(b => b.StartTime < slotEnd && b.EndTime > t);
            if (!isBooked) slots.Add(t);
        }
        return slots;
    }

    // ── Access Guards ─────────────────────────────────────────

    private static void EnforceReadAccess(Booking b, Guid callerId, string role)
    {
        if (role == Roles.SuperAdmin) return;
        if (role == Roles.Customer && b.CustomerId == callerId) return;
        if (role is Roles.PartnerAdmin or Roles.BranchManager or Roles.Staff) return;
        throw new UnauthorizedAccessException("Không có quyền xem booking này.");
    }

    private static void EnforceWriteAccess(Booking b, Guid callerId, string role, BookingStatus newStatus)
    {
        if (role == Roles.SuperAdmin) return;
        if (role == Roles.Customer)
        {
            if (b.CustomerId != callerId) throw new UnauthorizedAccessException();
            if (newStatus != BookingStatus.Cancelled)
                throw new InvalidOperationException("Khách hàng chỉ có thể hủy booking.");
            return;
        }
        // Staff can Confirm, CheckIn, CheckOut, Cancel (own branch enforced by scope)
        if (role is Roles.Staff or Roles.BranchManager or Roles.PartnerAdmin) return;
        throw new UnauthorizedAccessException();
    }

    private static BookingResponse MapToResponse(Booking b, Court c) => new(
        b.BookingId, b.CourtId, c.Name,
        c.Branch?.Name ?? "", c.Branch?.Partner?.Name ?? "",
        b.BookingDate, b.StartTime, b.EndTime, b.DurationMinutes,
        b.BaseAmount, b.DiscountAmount, b.TotalAmount,
        b.Status.ToString(), b.Note, b.CancelReason, b.CreatedAt);
}
