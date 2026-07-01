namespace SportSG.Domain.Enums;

public enum PartnerStatus   { Pending, Active, Suspended, Rejected }
public enum BranchStatus    { Active, Closed, Maintenance }
public enum CourtStatus     { Active, Maintenance, Inactive }
public enum BookingStatus   { Pending, Confirmed, CheckedIn, CheckedOut, Cancelled, NoShow }
public enum PaymentMethod   { MoMo, VNPay, PayOS, Cash, Wallet }
public enum PaymentStatus   { Pending, Success, Failed, Refunded }
public enum DiscountType    { Percent, Fixed }
public enum LoyaltyType     { Earn, Redeem, Expire, Bonus }
public enum NotificationType{ Info, Booking, Payment, System }
public enum MaintenanceStatus { Scheduled, InProgress, Done, Cancelled }
public enum MembershipStatus  { Active, Expired, Cancelled }
public enum PaymentGateway    { VNPay, MoMo }
public enum BannerPosition    { Home, Search, Checkout }
public enum NotificationChannel { InApp, Email, Push, SMS }
public enum ReportType        { Revenue, Booking, CourtUtilization, PeakHour, TopCourt, TopCustomer }
public enum CouponStatus      { Active, Expired, Depleted }

public static class Roles
{
    public const string SuperAdmin    = "SuperAdmin";
    public const string PartnerAdmin  = "PartnerAdmin";
    public const string BranchManager = "BranchManager";
    public const string Staff         = "Staff";
    public const string Customer      = "Customer";
}
