namespace SportBooking.Domain.Enums;

public enum UserRole
{
    Admin = 1,      // Platform owner — sees everything
    Owner = 2,      // Sport facility owner — sees own data
    Staff = 3,      // Branch employee — sees assigned branch
    Customer = 4    // End user — sees own bookings
}

public enum SportType
{
    Football = 1,
    Badminton = 2,
    TableTennis = 3,
    Tennis = 4,
    Pickleball = 5
}

public enum CourtStatus
{
    Available = 1,
    Occupied = 2,
    Maintenance = 3,
    Inactive = 4
}

public enum BookingStatus
{
    Pending = 1,     // Created, awaiting payment or confirmation
    Confirmed = 2,   // Payment received / confirmed
    Completed = 3,   // Play session done
    Cancelled = 4,   // Cancelled by customer or staff
    Expired = 5      // Pending too long, auto-expired by background job
}

public enum PaymentStatus
{
    Pending = 1,
    Success = 2,
    Failed = 3,
    Refunded = 4
}

public enum PaymentMethod
{
    Cash = 1,
    VNPay = 2,
    MoMo = 3
}

public enum OwnerStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3
}

public enum BranchStatus
{
    Active = 1,
    Inactive = 2
}

public enum PromotionType
{
    Percentage = 1,  // Discount by %
    Fixed = 2        // Discount by fixed amount
}

public enum NotificationType
{
    BookingConfirmed = 1,
    BookingCancelled = 2,
    PaymentSuccess = 3,
    PaymentFailed = 4,
    BookingExpired = 5,
    Promotional = 6
}