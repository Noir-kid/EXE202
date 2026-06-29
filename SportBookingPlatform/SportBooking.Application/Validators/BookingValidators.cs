using FluentValidation;
using SportBooking.Application.Commands.Bookings;

namespace SportBooking.Application.Validators;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.CourtId).NotEmpty();
        RuleFor(x => x.BookingDate).NotEmpty()
            .Must(d => d >= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Booking date cannot be in the past.");
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty()
            .GreaterThan(x => x.StartTime)
            .WithMessage("EndTime must be after StartTime.");
        RuleFor(x => x.Note).MaximumLength(500).When(x => x.Note is not null);
        RuleFor(x => x.PromotionCode).MaximumLength(50).When(x => x.PromotionCode is not null);
    }
}