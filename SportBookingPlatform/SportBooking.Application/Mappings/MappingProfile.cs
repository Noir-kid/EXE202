using AutoMapper;
using SportBooking.Application.Commands.Auth;
using SportBooking.Application.Commands.Bookings;
using SportBooking.Application.Commands.Branches;
using SportBooking.Application.Commands.Courts;
using SportBooking.Application.DTOs.Auth;
using SportBooking.Application.DTOs.Booking;
using SportBooking.Application.DTOs.Branch;
using SportBooking.Application.DTOs.Court;

namespace SportBooking.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Auth
        CreateMap<RegisterRequest, RegisterCommand>();
        CreateMap<LoginRequest, LoginCommand>();

        // Booking
        CreateMap<CreateBookingRequest, CreateBookingCommand>();

        // Court
        CreateMap<CreateCourtRequest, CreateCourtCommand>();
        CreateMap<UpdateCourtRequest, UpdateCourtCommand>()
            .ForMember(dest => dest.CourtId, opt => opt.Ignore());

        // Branch
        CreateMap<CreateBranchRequest, CreateBranchCommand>();
        CreateMap<UpdateBranchRequest, UpdateBranchCommand>()
            .ForMember(dest => dest.BranchId, opt => opt.Ignore());
    }
}