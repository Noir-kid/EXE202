using SportBooking.Domain.Enums;

namespace SportBooking.Application.DTOs.Payment;

public record CreatePaymentRequest(
    Guid BookingId,
    PaymentMethod Method,
    string ReturnUrl,
    string? ClientIp = null
);

public record CreatePaymentResponse(
    Guid PaymentId,
    string? PaymentUrl,   // null for Cash — confirmed immediately
    PaymentMethod Method,
    decimal Amount,
    PaymentStatus Status
);

public record PaymentResponse(
    Guid PaymentId,
    Guid BookingId,
    PaymentMethod Method,
    PaymentStatus Status,
    decimal Amount,
    string? GatewayTransactionId,
    DateTime? PaidAt,
    DateTime CreatedAt
);

// VNPay callback query parameters (bound from URL)
public record VNPayCallbackRequest(
    string vnp_TmnCode,
    string vnp_Amount,
    string vnp_BankCode,
    string vnp_BankTranNo,
    string vnp_CardType,
    string vnp_PayDate,
    string vnp_CurrCode,
    string vnp_TransactionNo,
    string vnp_ResponseCode,
    string vnp_TransactionStatus,
    string vnp_TxnRef,         // Our GatewayOrderId
    string vnp_SecureHash
);

// MoMo IPN payload
public record MoMoCallbackRequest(
    string partnerCode,
    string orderId,
    string requestId,
    long amount,
    string orderInfo,
    string orderType,
    string transId,
    int resultCode,
    string message,
    string payType,
    long responseTime,
    string extraData,
    string signature
);