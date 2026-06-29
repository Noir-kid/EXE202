using SportBooking.Domain.Enums;

namespace SportBooking.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid UserId { get; }
    string Email { get; }
    UserRole Role { get; }
    string FullName { get; }

    // Set for Owner/Staff users — null for Admin/Customer
    Guid? OwnerId { get; }
    Guid? BranchId { get; }

    bool IsAdmin => Role == UserRole.Admin;
    bool IsOwner => Role == UserRole.Owner;
    bool IsStaff => Role == UserRole.Staff;
    bool IsCustomer => Role == UserRole.Customer;

    bool IsAuthenticated { get; }
}
