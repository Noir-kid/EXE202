-- ============================================================
--  SportSG Multi-Tenant SaaS - Database Schema
--  SQL Server 2019+
-- ============================================================

-- ──────────────────────────────────────────────
--  LOOKUP / REFERENCE
-- ──────────────────────────────────────────────

CREATE TABLE SportTypes (
    SportTypeId   INT           IDENTITY PRIMARY KEY,
    Name          NVARCHAR(100) NOT NULL,
    Icon          NVARCHAR(500),
    IsActive      BIT           NOT NULL DEFAULT 1
);

CREATE TABLE Roles (
    RoleId   INT           IDENTITY PRIMARY KEY,
    Code     VARCHAR(30)   NOT NULL UNIQUE,   -- SuperAdmin|PartnerAdmin|BranchManager|Staff|Customer
    Name     NVARCHAR(100) NOT NULL
);

-- ──────────────────────────────────────────────
--  USERS
-- ──────────────────────────────────────────────

CREATE TABLE Users (
    UserId          UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    Email           NVARCHAR(200)    NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(500),                          -- NULL = OAuth only
    IsEmailVerified BIT              NOT NULL DEFAULT 0,
    RefreshToken    NVARCHAR(500),
    RefreshTokenExpiry DATETIME2,
    GoogleId        NVARCHAR(200),
    AvatarUrl       NVARCHAR(500),
    Phone           VARCHAR(20),
    FirstName       NVARCHAR(100),
    LastName        NVARCHAR(100),
    Balance         DECIMAL(18,2)    NOT NULL DEFAULT 0,
    LoyaltyPoints   INT              NOT NULL DEFAULT 0,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  MULTI-TENANT: PARTNER
-- ──────────────────────────────────────────────

CREATE TABLE Partners (
    PartnerId       UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    Name            NVARCHAR(200)    NOT NULL,
    LegalName       NVARCHAR(300),
    TaxCode         VARCHAR(20),
    ContactEmail    NVARCHAR(200)    NOT NULL,
    ContactPhone    VARCHAR(20),
    LogoUrl         NVARCHAR(500),
    Website         NVARCHAR(300),
    CommissionRate  DECIMAL(5,2)     NOT NULL DEFAULT 10.00,  -- % platform takes
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Pending', -- Pending|Active|Suspended|Rejected
    ApprovedAt      DATETIME2,
    ApprovedBy      UNIQUEIDENTIFIER REFERENCES Users(UserId),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- RBAC: which user has which role in which partner/branch
CREATE TABLE PartnerUserRoles (
    Id          INT              IDENTITY PRIMARY KEY,
    UserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    PartnerId   UNIQUEIDENTIFIER NOT NULL REFERENCES Partners(PartnerId),
    BranchId    UNIQUEIDENTIFIER,                               -- NULL = partner-wide scope
    RoleId      INT              NOT NULL REFERENCES Roles(RoleId),
    IsActive    BIT              NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (UserId, PartnerId, BranchId, RoleId)
);

-- ──────────────────────────────────────────────
--  BRANCH
-- ──────────────────────────────────────────────

CREATE TABLE Branches (
    BranchId    UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    PartnerId   UNIQUEIDENTIFIER NOT NULL REFERENCES Partners(PartnerId),
    Name        NVARCHAR(200)    NOT NULL,
    Address     NVARCHAR(500),
    City        NVARCHAR(100),
    District    NVARCHAR(100),
    Latitude    DECIMAL(10,7),
    Longitude   DECIMAL(10,7),
    Phone       VARCHAR(20),
    Email       NVARCHAR(200),
    ImageUrl    NVARCHAR(500),
    MapUrl      NVARCHAR(500),
    OpenTime    TIME,
    CloseTime   TIME,
    Status      VARCHAR(20)      NOT NULL DEFAULT 'Active',  -- Active|Closed|Maintenance
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- FK for PartnerUserRoles.BranchId
ALTER TABLE PartnerUserRoles
    ADD CONSTRAINT FK_PUR_Branch FOREIGN KEY (BranchId) REFERENCES Branches(BranchId);

CREATE TABLE BranchSportTypes (
    BranchId    UNIQUEIDENTIFIER NOT NULL REFERENCES Branches(BranchId),
    SportTypeId INT              NOT NULL REFERENCES SportTypes(SportTypeId),
    PRIMARY KEY (BranchId, SportTypeId)
);

-- ──────────────────────────────────────────────
--  COURT
-- ──────────────────────────────────────────────

CREATE TABLE Courts (
    CourtId         UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    BranchId        UNIQUEIDENTIFIER NOT NULL REFERENCES Branches(BranchId),
    SportTypeId     INT              NOT NULL REFERENCES SportTypes(SportTypeId),
    Name            NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(1000),
    ImageUrls       NVARCHAR(2000),                -- pipe-separated
    BasePrice       DECIMAL(10,2)    NOT NULL,      -- per hour
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Active', -- Active|Maintenance|Inactive
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- Dynamic pricing by time slot
CREATE TABLE CourtPricingRules (
    RuleId      INT              IDENTITY PRIMARY KEY,
    CourtId     UNIQUEIDENTIFIER NOT NULL REFERENCES Courts(CourtId),
    DayOfWeek   TINYINT,                        -- 0=Sun..6=Sat; NULL=all days
    StartTime   TIME             NOT NULL,
    EndTime     TIME             NOT NULL,
    Price       DECIMAL(10,2)    NOT NULL,
    Label       NVARCHAR(50),                   -- "Giờ vàng", "Off-peak"
    IsActive    BIT              NOT NULL DEFAULT 1
);

-- ──────────────────────────────────────────────
--  BOOKING
-- ──────────────────────────────────────────────

CREATE TABLE Bookings (
    BookingId       UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    CustomerId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    CourtId         UNIQUEIDENTIFIER NOT NULL REFERENCES Courts(CourtId),
    BookingDate     DATE             NOT NULL,
    StartTime       TIME             NOT NULL,
    EndTime         TIME             NOT NULL,
    DurationMinutes INT              NOT NULL,
    BaseAmount      DECIMAL(10,2)    NOT NULL,
    DiscountAmount  DECIMAL(10,2)    NOT NULL DEFAULT 0,
    TotalAmount     DECIMAL(10,2)    NOT NULL,
    Note            NVARCHAR(500),
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Pending',
    -- Pending|Confirmed|CheckedIn|CheckedOut|Cancelled|NoShow
    CancelReason    NVARCHAR(500),
    CreatedBy       UNIQUEIDENTIFIER REFERENCES Users(UserId), -- staff walk-in booking
    ConfirmedBy     UNIQUEIDENTIFIER REFERENCES Users(UserId),
    PromotionId     UNIQUEIDENTIFIER,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  PAYMENT
-- ──────────────────────────────────────────────

CREATE TABLE Payments (
    PaymentId       UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    BookingId       UNIQUEIDENTIFIER NOT NULL REFERENCES Bookings(BookingId),
    UserId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    Amount          DECIMAL(10,2)    NOT NULL,
    Method          VARCHAR(20)      NOT NULL, -- MoMo|VNPay|PayOS|Cash|Wallet
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Pending', -- Pending|Success|Failed|Refunded
    TransactionRef  VARCHAR(100),              -- gateway reference
    GatewayResponse NVARCHAR(2000),
    PaidAt          DATETIME2,
    RefundedAt      DATETIME2,
    RefundReason    NVARCHAR(500),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- Platform commission ledger
CREATE TABLE CommissionLedger (
    Id              INT              IDENTITY PRIMARY KEY,
    PaymentId       UNIQUEIDENTIFIER NOT NULL REFERENCES Payments(PaymentId),
    PartnerId       UNIQUEIDENTIFIER NOT NULL REFERENCES Partners(PartnerId),
    GrossAmount     DECIMAL(10,2)    NOT NULL,
    CommissionRate  DECIMAL(5,2)     NOT NULL,
    CommissionAmt   DECIMAL(10,2)    NOT NULL,
    NetAmount       DECIMAL(10,2)    NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  PROMOTION
-- ──────────────────────────────────────────────

CREATE TABLE Promotions (
    PromotionId     UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    PartnerId       UNIQUEIDENTIFIER REFERENCES Partners(PartnerId), -- NULL = platform-wide
    Code            VARCHAR(30)      NOT NULL UNIQUE,
    Name            NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(500),
    DiscountType    VARCHAR(10)      NOT NULL, -- Percent|Fixed
    DiscountValue   DECIMAL(10,2)    NOT NULL,
    MinOrderAmount  DECIMAL(10,2)    NOT NULL DEFAULT 0,
    MaxDiscount     DECIMAL(10,2),
    UsageLimit      INT,
    UsageCount      INT              NOT NULL DEFAULT 0,
    ValidFrom       DATETIME2        NOT NULL,
    ValidTo         DATETIME2        NOT NULL,
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

ALTER TABLE Bookings
    ADD CONSTRAINT FK_Booking_Promotion FOREIGN KEY (PromotionId) REFERENCES Promotions(PromotionId);

-- ──────────────────────────────────────────────
--  REVIEW
-- ──────────────────────────────────────────────

CREATE TABLE Reviews (
    ReviewId        UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    BookingId       UNIQUEIDENTIFIER NOT NULL REFERENCES Bookings(BookingId),
    UserId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    CourtId         UNIQUEIDENTIFIER NOT NULL REFERENCES Courts(CourtId),
    Rating          TINYINT          NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment         NVARCHAR(1000),
    ImageUrls       NVARCHAR(2000),
    IsVisible       BIT              NOT NULL DEFAULT 1,
    ReplyContent    NVARCHAR(1000),  -- partner reply
    RepliedAt       DATETIME2,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (BookingId)               -- one review per booking
);

-- ──────────────────────────────────────────────
--  MEMBERSHIP
-- ──────────────────────────────────────────────

CREATE TABLE Memberships (
    MembershipId    UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    PartnerId       UNIQUEIDENTIFIER NOT NULL REFERENCES Partners(PartnerId),
    Name            NVARCHAR(200)    NOT NULL,
    Description     NVARCHAR(500),
    Price           DECIMAL(10,2)    NOT NULL,
    DurationDays    INT              NOT NULL,
    DiscountPercent DECIMAL(5,2)     NOT NULL DEFAULT 0,
    LoyaltyMulti    DECIMAL(4,2)     NOT NULL DEFAULT 1.0, -- loyalty point multiplier
    IsActive        BIT              NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE UserMemberships (
    Id              INT              IDENTITY PRIMARY KEY,
    UserId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    MembershipId    UNIQUEIDENTIFIER NOT NULL REFERENCES Memberships(MembershipId),
    StartDate       DATE             NOT NULL,
    EndDate         DATE             NOT NULL,
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Active', -- Active|Expired|Cancelled
    PaidAmount      DECIMAL(10,2)    NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  LOYALTY POINTS
-- ──────────────────────────────────────────────

CREATE TABLE LoyaltyTransactions (
    Id          BIGINT           IDENTITY PRIMARY KEY,
    UserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    Points      INT              NOT NULL,           -- positive=earn, negative=redeem
    Type        VARCHAR(20)      NOT NULL,            -- Earn|Redeem|Expire|Bonus
    RefType     VARCHAR(30),                          -- Booking|Promotion|Manual
    RefId       UNIQUEIDENTIFIER,
    Note        NVARCHAR(200),
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  MAINTENANCE
-- ──────────────────────────────────────────────

CREATE TABLE MaintenanceSchedules (
    MaintenanceId   UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    CourtId         UNIQUEIDENTIFIER NOT NULL REFERENCES Courts(CourtId),
    StartTime       DATETIME2        NOT NULL,
    EndTime         DATETIME2        NOT NULL,
    Reason          NVARCHAR(500)    NOT NULL,
    Status          VARCHAR(20)      NOT NULL DEFAULT 'Scheduled', -- Scheduled|InProgress|Done|Cancelled
    CreatedBy       UNIQUEIDENTIFIER REFERENCES Users(UserId),
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  NOTIFICATION
-- ──────────────────────────────────────────────

CREATE TABLE Notifications (
    NotificationId  BIGINT           IDENTITY PRIMARY KEY,
    UserId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(UserId),
    Title           NVARCHAR(200)    NOT NULL,
    Message         NVARCHAR(1000)   NOT NULL,
    Type            VARCHAR(30)      NOT NULL DEFAULT 'Info', -- Info|Booking|Payment|System
    RefType         VARCHAR(30),
    RefId           UNIQUEIDENTIFIER,
    IsRead          BIT              NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE()
);

-- ──────────────────────────────────────────────
--  SEED DATA
-- ──────────────────────────────────────────────

INSERT INTO SportTypes (Name, Icon) VALUES
('Cầu lông',  'badminton'),
('Bóng đá',   'soccer'),
('Tennis',    'tennis'),
('Pickleball','pickleball'),
('Bóng bàn',  'tabletennis'),
('Bóng rổ',   'basketball');

INSERT INTO Roles (Code, Name) VALUES
('SuperAdmin',     N'Quản trị hệ thống'),
('PartnerAdmin',   N'Chủ sân'),
('BranchManager',  N'Quản lý chi nhánh'),
('Staff',          N'Nhân viên'),
('Customer',       N'Khách hàng');
