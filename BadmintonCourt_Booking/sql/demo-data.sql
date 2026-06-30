-- ================================================================
-- SPORTSG PLATFORM — FULL SETUP (TẠO DB + BẢNG + DỮ LIỆU DEMO)
-- Ngày tạo : 2026-06-28
-- ================================================================
-- Chạy file này trên SQL Server để dựng toàn bộ DB từ đầu.
-- CẢNH BÁO: Script sẽ XÓA rồi TẠO LẠI toàn bộ tables!
--
-- MẬT KHẨU DEMO: tất cả tài khoản đều dùng  "password"
--   BCrypt hash = $2a$11$ZdZUzkGDk0wjkOhEZ6kPA.WQJddtBqudn/5Cr9IRgjrzR9akhsY.S
--
-- TÀI KHOẢN:
--   superadmin@sportsg.com      → SuperAdmin
--   owner.hn@bmtc.vn            → PartnerAdmin  (BMTC Hà Nội)
--   owner.sg@sportzone.vn       → PartnerAdmin  (SportZone SG)
--   manager.caugiay@bmtc.vn     → BranchManager (BMTC Cầu Giấy)
--   manager.longbien@bmtc.vn    → BranchManager (BMTC Long Biên)
--   staff1.caugiay@bmtc.vn      → Staff
--   staff2.quan1@sportzone.vn   → Staff
--   an/binh/cuong/dung/em       → Customer
-- ================================================================

SET NOCOUNT ON;
GO

-- ================================================================
-- 0. XÓA VÀ TẠO LẠI DATABASE (đảm bảo clean slate)
-- ================================================================
USE master;
GO

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = N'SportSGDb')
BEGIN
    -- Đóng tất cả connection đang mở vào DB
    ALTER DATABASE SportSGDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE SportSGDb;
    PRINT N'[OK] Da xoa database SportSGDb cu.';
END

CREATE DATABASE SportSGDb COLLATE Vietnamese_CI_AI;
PRINT N'[OK] Da tao database SportSGDb moi.';
GO

USE SportSGDb;
GO

-- ================================================================
-- 1. TẠO BẢNG (thứ tự theo FK dependency)
-- ================================================================

-- ── Roles ────────────────────────────────────────────────────────
CREATE TABLE [Roles] (
    [RoleId] INT           IDENTITY(1,1) NOT NULL,
    [Code]   NVARCHAR(50)  NOT NULL,
    [Name]   NVARCHAR(100) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([RoleId])
);

-- ── SportTypes ───────────────────────────────────────────────────
CREATE TABLE [SportTypes] (
    [SportTypeId] INT          IDENTITY(1,1) NOT NULL,
    [Name]        NVARCHAR(100) NOT NULL,
    [Icon]        NVARCHAR(20)  NULL,
    [IsActive]    BIT           NOT NULL CONSTRAINT [DF_SportTypes_IsActive] DEFAULT 1,
    CONSTRAINT [PK_SportTypes] PRIMARY KEY ([SportTypeId])
);

-- ── CourtTypes ───────────────────────────────────────────────────
CREATE TABLE [CourtTypes] (
    [CourtTypeId] INT           IDENTITY(1,1) NOT NULL,
    [Name]        NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [IsActive]    BIT           NOT NULL CONSTRAINT [DF_CourtTypes_IsActive] DEFAULT 1,
    CONSTRAINT [PK_CourtTypes] PRIMARY KEY ([CourtTypeId])
);

-- ── Banners ──────────────────────────────────────────────────────
CREATE TABLE [Banners] (
    [BannerId]  INT           IDENTITY(1,1) NOT NULL,
    [Title]     NVARCHAR(MAX) NOT NULL,
    [Subtitle]  NVARCHAR(MAX) NULL,
    [ImageUrl]  NVARCHAR(MAX) NOT NULL,
    [LinkUrl]   NVARCHAR(MAX) NULL,
    [Position]  NVARCHAR(50)  NOT NULL CONSTRAINT [DF_Banners_Position]  DEFAULT N'Home',
    [SortOrder] INT           NOT NULL CONSTRAINT [DF_Banners_SortOrder] DEFAULT 0,
    [IsActive]  BIT           NOT NULL CONSTRAINT [DF_Banners_IsActive]  DEFAULT 1,
    [StartsAt]  DATETIME2(7)  NULL,
    [EndsAt]    DATETIME2(7)  NULL,
    [CreatedAt] DATETIME2(7)  NOT NULL CONSTRAINT [DF_Banners_CreatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Banners] PRIMARY KEY ([BannerId])
);

-- ── Permissions ──────────────────────────────────────────────────
CREATE TABLE [Permissions] (
    [PermissionId] INT           IDENTITY(1,1) NOT NULL,
    [Code]         NVARCHAR(450) NOT NULL,
    [Name]         NVARCHAR(MAX) NOT NULL,
    [Module]       NVARCHAR(MAX) NOT NULL,
    CONSTRAINT [PK_Permissions] PRIMARY KEY ([PermissionId])
);

-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE [Users] (
    [UserId]             UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Users_UserId]   DEFAULT NEWID(),
    [Email]              NVARCHAR(450)    NOT NULL,
    [PasswordHash]       NVARCHAR(MAX)    NULL,
    [IsEmailVerified]    BIT              NOT NULL CONSTRAINT [DF_Users_EmailVer] DEFAULT 0,
    [GoogleId]           NVARCHAR(MAX)    NULL,
    [PublicId]           NVARCHAR(MAX)    NULL,
    [AvatarUrl]          NVARCHAR(MAX)    NULL,
    [Phone]              NVARCHAR(MAX)    NULL,
    [FirstName]          NVARCHAR(MAX)    NULL,
    [LastName]           NVARCHAR(MAX)    NULL,
    [Balance]            DECIMAL(18,2)    NOT NULL CONSTRAINT [DF_Users_Balance]  DEFAULT 0,
    [LoyaltyPoints]      INT              NOT NULL CONSTRAINT [DF_Users_Loyalty]  DEFAULT 0,
    [IsActive]           BIT              NOT NULL CONSTRAINT [DF_Users_IsActive] DEFAULT 1,
    [RefreshToken]       NVARCHAR(MAX)    NULL,
    [RefreshTokenExpiry] DATETIME2(7)     NULL,
    [CreatedAt]          DATETIME2(7)     NOT NULL CONSTRAINT [DF_Users_CreatedAt] DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]          DATETIME2(7)     NOT NULL CONSTRAINT [DF_Users_UpdatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Users] PRIMARY KEY ([UserId])
);

-- ── Partners ─────────────────────────────────────────────────────
CREATE TABLE [Partners] (
    [PartnerId]      UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Partners_Id]     DEFAULT NEWID(),
    [Name]           NVARCHAR(MAX)    NOT NULL,
    [LegalName]      NVARCHAR(MAX)    NULL,
    [TaxCode]        NVARCHAR(MAX)    NULL,
    [ContactEmail]   NVARCHAR(MAX)    NOT NULL,
    [ContactPhone]   NVARCHAR(MAX)    NULL,
    [LogoUrl]        NVARCHAR(MAX)    NULL,
    [Website]        NVARCHAR(MAX)    NULL,
    [CommissionRate] DECIMAL(5,2)     NOT NULL CONSTRAINT [DF_Partners_Comm]   DEFAULT 10.00,
    [Status]         NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Partners_Status] DEFAULT N'Pending',
    [ApprovedAt]     DATETIME2(7)     NULL,
    [ApprovedBy]     UNIQUEIDENTIFIER NULL,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_Partners_CAt]    DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_Partners_UAt]    DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Partners] PRIMARY KEY ([PartnerId])
);

-- ── Branches ─────────────────────────────────────────────────────
CREATE TABLE [Branches] (
    [BranchId]  UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Branches_Id]     DEFAULT NEWID(),
    [PartnerId] UNIQUEIDENTIFIER NOT NULL,
    [Name]      NVARCHAR(MAX)    NOT NULL,
    [Address]   NVARCHAR(MAX)    NULL,
    [City]      NVARCHAR(MAX)    NULL,
    [District]  NVARCHAR(MAX)    NULL,
    [Latitude]  DECIMAL(9,6)     NULL,
    [Longitude] DECIMAL(9,6)     NULL,
    [Phone]     NVARCHAR(MAX)    NULL,
    [Email]     NVARCHAR(MAX)    NULL,
    [ImageUrl]  NVARCHAR(MAX)    NULL,
    [MapUrl]    NVARCHAR(MAX)    NULL,
    [OpenTime]  TIME             NULL,
    [CloseTime] TIME             NULL,
    [Status]    NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Branches_Status] DEFAULT N'Active',
    [CreatedAt] DATETIME2(7)     NOT NULL CONSTRAINT [DF_Branches_CAt]    DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2(7)     NOT NULL CONSTRAINT [DF_Branches_UAt]    DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Branches]           PRIMARY KEY ([BranchId]),
    CONSTRAINT [FK_Branches_Partners]  FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId])
);

-- ── BranchSportTypes ─────────────────────────────────────────────
CREATE TABLE [BranchSportTypes] (
    [BranchId]    UNIQUEIDENTIFIER NOT NULL,
    [SportTypeId] INT              NOT NULL,
    CONSTRAINT [PK_BranchSportTypes] PRIMARY KEY ([BranchId], [SportTypeId]),
    CONSTRAINT [FK_BST_Branches]     FOREIGN KEY ([BranchId])    REFERENCES [Branches]([BranchId]),
    CONSTRAINT [FK_BST_SportTypes]   FOREIGN KEY ([SportTypeId]) REFERENCES [SportTypes]([SportTypeId])
);

-- ── Courts ───────────────────────────────────────────────────────
CREATE TABLE [Courts] (
    [CourtId]     UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Courts_Id]     DEFAULT NEWID(),
    [BranchId]    UNIQUEIDENTIFIER NOT NULL,
    [SportTypeId] INT              NOT NULL,
    [CourtTypeId] INT              NULL,
    [Name]        NVARCHAR(MAX)    NOT NULL,
    [Description] NVARCHAR(MAX)    NULL,
    [BasePrice]   DECIMAL(10,2)    NOT NULL CONSTRAINT [DF_Courts_Price]  DEFAULT 0,
    [Capacity]    INT              NULL,
    [Status]      NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Courts_Status] DEFAULT N'Active',
    [CreatedAt]   DATETIME2(7)     NOT NULL CONSTRAINT [DF_Courts_CAt]    DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]   DATETIME2(7)     NOT NULL CONSTRAINT [DF_Courts_UAt]    DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Courts]            PRIMARY KEY ([CourtId]),
    CONSTRAINT [FK_Courts_Branches]   FOREIGN KEY ([BranchId])    REFERENCES [Branches]([BranchId]),
    CONSTRAINT [FK_Courts_SportTypes] FOREIGN KEY ([SportTypeId]) REFERENCES [SportTypes]([SportTypeId]),
    CONSTRAINT [FK_Courts_CourtTypes] FOREIGN KEY ([CourtTypeId]) REFERENCES [CourtTypes]([CourtTypeId])
);

-- ── CourtPricingRules ────────────────────────────────────────────
CREATE TABLE [CourtPricingRules] (
    [RuleId]    INT              IDENTITY(1,1) NOT NULL,
    [CourtId]   UNIQUEIDENTIFIER NOT NULL,
    [DayOfWeek] INT              NULL,   -- NULL=all days; 0=Sun,1=Mon,...,6=Sat
    [StartTime] TIME             NOT NULL,
    [EndTime]   TIME             NOT NULL,
    [Price]     DECIMAL(10,2)    NOT NULL,
    [Label]     NVARCHAR(MAX)    NULL,
    [IsActive]  BIT              NOT NULL CONSTRAINT [DF_CPR_IsActive] DEFAULT 1,
    CONSTRAINT [PK_CourtPricingRules] PRIMARY KEY ([RuleId]),
    CONSTRAINT [FK_CPR_Courts]        FOREIGN KEY ([CourtId]) REFERENCES [Courts]([CourtId])
);

-- ── CourtImages ──────────────────────────────────────────────────
CREATE TABLE [CourtImages] (
    [CourtImageId] INT              IDENTITY(1,1) NOT NULL,
    [CourtId]      UNIQUEIDENTIFIER NOT NULL,
    [Url]          NVARCHAR(MAX)    NOT NULL,
    [PublicId]     NVARCHAR(MAX)    NULL,
    [IsPrimary]    BIT              NOT NULL CONSTRAINT [DF_CI_Primary]   DEFAULT 0,
    [SortOrder]    INT              NOT NULL CONSTRAINT [DF_CI_SortOrder] DEFAULT 0,
    [CreatedAt]    DATETIME2(7)     NOT NULL CONSTRAINT [DF_CI_CreatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_CourtImages]        PRIMARY KEY ([CourtImageId]),
    CONSTRAINT [FK_CourtImages_Courts] FOREIGN KEY ([CourtId]) REFERENCES [Courts]([CourtId])
);

-- ── CourtFacilities ──────────────────────────────────────────────
CREATE TABLE [CourtFacilities] (
    [CourtFacilityId] INT              IDENTITY(1,1) NOT NULL,
    [CourtId]         UNIQUEIDENTIFIER NOT NULL,
    [Name]            NVARCHAR(MAX)    NOT NULL,
    [Icon]            NVARCHAR(MAX)    NULL,
    CONSTRAINT [PK_CourtFacilities]        PRIMARY KEY ([CourtFacilityId]),
    CONSTRAINT [FK_CourtFacilities_Courts] FOREIGN KEY ([CourtId]) REFERENCES [Courts]([CourtId])
);

-- ── PartnerUserRoles ─────────────────────────────────────────────
CREATE TABLE [PartnerUserRoles] (
    [Id]        INT              IDENTITY(1,1)  NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [PartnerId] UNIQUEIDENTIFIER NOT NULL,
    [BranchId]  UNIQUEIDENTIFIER NULL,
    [RoleId]    INT              NOT NULL,
    [IsActive]  BIT              NOT NULL CONSTRAINT [DF_PUR_IsActive]  DEFAULT 1,
    [CreatedAt] DATETIME2(7)     NOT NULL CONSTRAINT [DF_PUR_CreatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_PartnerUserRoles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PUR_Users]        FOREIGN KEY ([UserId])    REFERENCES [Users]([UserId]),
    CONSTRAINT [FK_PUR_Partners]     FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId]),
    CONSTRAINT [FK_PUR_Branches]     FOREIGN KEY ([BranchId])  REFERENCES [Branches]([BranchId]),
    CONSTRAINT [FK_PUR_Roles]        FOREIGN KEY ([RoleId])    REFERENCES [Roles]([RoleId])
);

-- ── Memberships ──────────────────────────────────────────────────
CREATE TABLE [Memberships] (
    [MembershipId]      UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Mem_Id]          DEFAULT NEWID(),
    [PartnerId]         UNIQUEIDENTIFIER NOT NULL,
    [Name]              NVARCHAR(MAX)    NOT NULL,
    [Description]       NVARCHAR(MAX)    NULL,
    [Price]             DECIMAL(10,2)    NOT NULL,
    [DurationDays]      INT              NOT NULL,
    [DiscountPercent]   DECIMAL(5,2)     NOT NULL CONSTRAINT [DF_Mem_Disc]        DEFAULT 0,
    [LoyaltyMultiplier] DECIMAL(5,2)     NOT NULL CONSTRAINT [DF_Mem_LoyaltyMul]  DEFAULT 1,
    [IsActive]          BIT              NOT NULL CONSTRAINT [DF_Mem_IsActive]    DEFAULT 1,
    [CreatedAt]         DATETIME2(7)     NOT NULL CONSTRAINT [DF_Mem_CreatedAt]   DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Memberships]          PRIMARY KEY ([MembershipId]),
    CONSTRAINT [FK_Memberships_Partners] FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId])
);

-- ── UserMemberships ──────────────────────────────────────────────
CREATE TABLE [UserMemberships] (
    [Id]           INT              IDENTITY(1,1) NOT NULL,
    [UserId]       UNIQUEIDENTIFIER NOT NULL,
    [MembershipId] UNIQUEIDENTIFIER NOT NULL,
    [StartDate]    DATE             NOT NULL,
    [EndDate]      DATE             NOT NULL,
    [Status]       NVARCHAR(50)     NOT NULL CONSTRAINT [DF_UM_Status]    DEFAULT N'Active',
    [PaidAmount]   DECIMAL(10,2)    NOT NULL,
    [CreatedAt]    DATETIME2(7)     NOT NULL CONSTRAINT [DF_UM_CreatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_UserMemberships]  PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UM_Users]         FOREIGN KEY ([UserId])       REFERENCES [Users]([UserId]),
    CONSTRAINT [FK_UM_Memberships]   FOREIGN KEY ([MembershipId]) REFERENCES [Memberships]([MembershipId])
);

-- ── Promotions ───────────────────────────────────────────────────
CREATE TABLE [Promotions] (
    [PromotionId]    UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Promo_Id]      DEFAULT NEWID(),
    [PartnerId]      UNIQUEIDENTIFIER NULL,
    [Code]           NVARCHAR(450)    NOT NULL,
    [Name]           NVARCHAR(MAX)    NOT NULL,
    [Description]    NVARCHAR(MAX)    NULL,
    [DiscountType]   NVARCHAR(50)     NOT NULL,
    [DiscountValue]  DECIMAL(10,2)    NOT NULL,
    [MinOrderAmount] DECIMAL(10,2)    NOT NULL CONSTRAINT [DF_Promo_MinAmt]  DEFAULT 0,
    [MaxDiscount]    DECIMAL(10,2)    NULL,
    [UsageLimit]     INT              NULL,
    [UsageCount]     INT              NOT NULL CONSTRAINT [DF_Promo_UsageCnt] DEFAULT 0,
    [ValidFrom]      DATETIME2(7)     NOT NULL,
    [ValidTo]        DATETIME2(7)     NOT NULL,
    [IsActive]       BIT              NOT NULL CONSTRAINT [DF_Promo_IsActive] DEFAULT 1,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_Promo_CAt]      DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Promotions]          PRIMARY KEY ([PromotionId]),
    CONSTRAINT [FK_Promotions_Partners] FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId])
);

-- ── Coupons ──────────────────────────────────────────────────────
CREATE TABLE [Coupons] (
    [CouponId]       INT              IDENTITY(1,1) NOT NULL,
    [PartnerId]      UNIQUEIDENTIFIER NULL,
    [Code]           NVARCHAR(450)    NOT NULL,
    [DiscountType]   NVARCHAR(50)     NOT NULL,
    [DiscountValue]  DECIMAL(10,2)    NOT NULL,
    [MinOrderAmount] DECIMAL(10,2)    NOT NULL CONSTRAINT [DF_Coupon_MinAmt]   DEFAULT 0,
    [MaxDiscount]    DECIMAL(10,2)    NULL,
    [UsageLimit]     INT              NULL,
    [UsageCount]     INT              NOT NULL CONSTRAINT [DF_Coupon_UsageCnt] DEFAULT 0,
    [ValidFrom]      DATETIME2(7)     NOT NULL,
    [ValidTo]        DATETIME2(7)     NOT NULL,
    [IsActive]       BIT              NOT NULL CONSTRAINT [DF_Coupon_IsActive]  DEFAULT 1,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_Coupon_CAt]       DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Coupons]          PRIMARY KEY ([CouponId]),
    CONSTRAINT [FK_Coupons_Partners] FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId])
);

-- ── Schedules ────────────────────────────────────────────────────
CREATE TABLE [Schedules] (
    [ScheduleId] INT              IDENTITY(1,1) NOT NULL,
    [BranchId]   UNIQUEIDENTIFIER NOT NULL,
    [DayOfWeek]  INT              NOT NULL,   -- 0=Sun,1=Mon,...,6=Sat
    [OpenTime]   TIME             NOT NULL,
    [CloseTime]  TIME             NOT NULL,
    [IsClosed]   BIT              NOT NULL CONSTRAINT [DF_Sched_IsClosed] DEFAULT 0,
    CONSTRAINT [PK_Schedules]          PRIMARY KEY ([ScheduleId]),
    CONSTRAINT [FK_Schedules_Branches] FOREIGN KEY ([BranchId]) REFERENCES [Branches]([BranchId])
);

-- ── Holidays ─────────────────────────────────────────────────────
CREATE TABLE [Holidays] (
    [HolidayId]         INT              IDENTITY(1,1) NOT NULL,
    [BranchId]          UNIQUEIDENTIFIER NULL,
    [Date]              DATE             NOT NULL,
    [Reason]            NVARCHAR(MAX)    NOT NULL,
    [IsRecurringYearly] BIT              NOT NULL CONSTRAINT [DF_Holiday_Recur] DEFAULT 0,
    CONSTRAINT [PK_Holidays]          PRIMARY KEY ([HolidayId]),
    CONSTRAINT [FK_Holidays_Branches] FOREIGN KEY ([BranchId]) REFERENCES [Branches]([BranchId])
);

-- ── MaintenanceSchedules ─────────────────────────────────────────
CREATE TABLE [MaintenanceSchedules] (
    [MaintenanceId] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_MS_Id]        DEFAULT NEWID(),
    [CourtId]       UNIQUEIDENTIFIER NOT NULL,
    [StartTime]     DATETIME2(7)     NOT NULL,
    [EndTime]       DATETIME2(7)     NOT NULL,
    [Reason]        NVARCHAR(MAX)    NOT NULL,
    [Status]        NVARCHAR(50)     NOT NULL CONSTRAINT [DF_MS_Status]    DEFAULT N'Scheduled',
    [CreatedBy]     UNIQUEIDENTIFIER NULL,
    [CreatedAt]     DATETIME2(7)     NOT NULL CONSTRAINT [DF_MS_CreatedAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_MaintenanceSchedules] PRIMARY KEY ([MaintenanceId]),
    CONSTRAINT [FK_MS_Courts]            FOREIGN KEY ([CourtId]) REFERENCES [Courts]([CourtId])
);

-- ── Bookings ─────────────────────────────────────────────────────
CREATE TABLE [Bookings] (
    [BookingId]       UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Bk_Id]      DEFAULT NEWID(),
    [CustomerId]      UNIQUEIDENTIFIER NOT NULL,
    [CourtId]         UNIQUEIDENTIFIER NOT NULL,
    [BookingDate]     DATE             NOT NULL,
    [StartTime]       TIME             NOT NULL,
    [EndTime]         TIME             NOT NULL,
    [DurationMinutes] INT              NOT NULL,
    [BaseAmount]      DECIMAL(10,2)    NOT NULL,
    [DiscountAmount]  DECIMAL(10,2)    NOT NULL CONSTRAINT [DF_Bk_Discount] DEFAULT 0,
    [TotalAmount]     DECIMAL(10,2)    NOT NULL,
    [Note]            NVARCHAR(MAX)    NULL,
    [Status]          NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Bk_Status]   DEFAULT N'Pending',
    [CancelReason]    NVARCHAR(MAX)    NULL,
    [CreatedBy]       UNIQUEIDENTIFIER NULL,
    [ConfirmedBy]     UNIQUEIDENTIFIER NULL,
    [PromotionId]     UNIQUEIDENTIFIER NULL,
    [CreatedAt]       DATETIME2(7)     NOT NULL CONSTRAINT [DF_Bk_CAt]      DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]       DATETIME2(7)     NOT NULL CONSTRAINT [DF_Bk_UAt]      DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Bookings]            PRIMARY KEY ([BookingId]),
    CONSTRAINT [FK_Bookings_Users]      FOREIGN KEY ([CustomerId])  REFERENCES [Users]([UserId]),
    CONSTRAINT [FK_Bookings_Courts]     FOREIGN KEY ([CourtId])     REFERENCES [Courts]([CourtId]),
    CONSTRAINT [FK_Bookings_Promotions] FOREIGN KEY ([PromotionId]) REFERENCES [Promotions]([PromotionId])
);

-- ── Payments ─────────────────────────────────────────────────────
CREATE TABLE [Payments] (
    [PaymentId]       UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Pay_Id]    DEFAULT NEWID(),
    [BookingId]       UNIQUEIDENTIFIER NOT NULL,
    [UserId]          UNIQUEIDENTIFIER NOT NULL,
    [Amount]          DECIMAL(10,2)    NOT NULL,
    [Method]          NVARCHAR(50)     NOT NULL,
    [Status]          NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Pay_Status] DEFAULT N'Pending',
    [TransactionRef]  NVARCHAR(MAX)    NULL,
    [GatewayResponse] NVARCHAR(MAX)    NULL,
    [PaidAt]          DATETIME2(7)     NULL,
    [RefundedAt]      DATETIME2(7)     NULL,
    [RefundReason]    NVARCHAR(MAX)    NULL,
    [CreatedAt]       DATETIME2(7)     NOT NULL CONSTRAINT [DF_Pay_CAt]   DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Payments]          PRIMARY KEY ([PaymentId]),
    CONSTRAINT [FK_Payments_Bookings] FOREIGN KEY ([BookingId]) REFERENCES [Bookings]([BookingId]),
    CONSTRAINT [FK_Payments_Users]    FOREIGN KEY ([UserId])    REFERENCES [Users]([UserId])
);

-- ── CommissionLedger ─────────────────────────────────────────────
CREATE TABLE [CommissionLedger] (
    [Id]             INT              IDENTITY(1,1) NOT NULL,
    [PaymentId]      UNIQUEIDENTIFIER NOT NULL,
    [PartnerId]      UNIQUEIDENTIFIER NOT NULL,
    [GrossAmount]    DECIMAL(10,2)    NOT NULL,
    [CommissionRate] DECIMAL(5,2)     NOT NULL,
    [CommissionAmt]  DECIMAL(10,2)    NOT NULL,
    [NetAmount]      DECIMAL(10,2)    NOT NULL,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_CL_CAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_CommissionLedger] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_CL_Payments]      FOREIGN KEY ([PaymentId]) REFERENCES [Payments]([PaymentId]),
    CONSTRAINT [FK_CL_Partners]      FOREIGN KEY ([PartnerId]) REFERENCES [Partners]([PartnerId])
);

-- ── Reviews ──────────────────────────────────────────────────────
CREATE TABLE [Reviews] (
    [ReviewId]     UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Rev_Id]      DEFAULT NEWID(),
    [BookingId]    UNIQUEIDENTIFIER NOT NULL,
    [UserId]       UNIQUEIDENTIFIER NOT NULL,
    [CourtId]      UNIQUEIDENTIFIER NOT NULL,
    [Rating]       TINYINT          NOT NULL,
    [Comment]      NVARCHAR(MAX)    NULL,
    [ImageUrls]    NVARCHAR(MAX)    NULL,
    [IsVisible]    BIT              NOT NULL CONSTRAINT [DF_Rev_Visible]  DEFAULT 1,
    [ReplyContent] NVARCHAR(MAX)    NULL,
    [RepliedAt]    DATETIME2(7)     NULL,
    [CreatedAt]    DATETIME2(7)     NOT NULL CONSTRAINT [DF_Rev_CAt]     DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Reviews]          PRIMARY KEY ([ReviewId]),
    CONSTRAINT [FK_Reviews_Bookings] FOREIGN KEY ([BookingId]) REFERENCES [Bookings]([BookingId]),
    CONSTRAINT [FK_Reviews_Users]    FOREIGN KEY ([UserId])    REFERENCES [Users]([UserId]),
    CONSTRAINT [FK_Reviews_Courts]   FOREIGN KEY ([CourtId])   REFERENCES [Courts]([CourtId])
);

-- ── Favorites ────────────────────────────────────────────────────
CREATE TABLE [Favorites] (
    [FavoriteId] INT              IDENTITY(1,1) NOT NULL,
    [UserId]     UNIQUEIDENTIFIER NOT NULL,
    [CourtId]    UNIQUEIDENTIFIER NOT NULL,
    [CreatedAt]  DATETIME2(7)     NOT NULL CONSTRAINT [DF_Fav_CAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Favorites]        PRIMARY KEY ([FavoriteId]),
    CONSTRAINT [FK_Favorites_Users]  FOREIGN KEY ([UserId])  REFERENCES [Users]([UserId]),
    CONSTRAINT [FK_Favorites_Courts] FOREIGN KEY ([CourtId]) REFERENCES [Courts]([CourtId])
);

-- ── LoyaltyTransactions ──────────────────────────────────────────
CREATE TABLE [LoyaltyTransactions] (
    [Id]        BIGINT           IDENTITY(1,1) NOT NULL,
    [UserId]    UNIQUEIDENTIFIER NOT NULL,
    [Points]    INT              NOT NULL,
    [Type]      NVARCHAR(50)     NOT NULL,
    [RefType]   NVARCHAR(MAX)    NULL,
    [RefId]     UNIQUEIDENTIFIER NULL,
    [Note]      NVARCHAR(MAX)    NULL,
    [CreatedAt] DATETIME2(7)     NOT NULL CONSTRAINT [DF_LT_CAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_LoyaltyTransactions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_LT_Users]            FOREIGN KEY ([UserId]) REFERENCES [Users]([UserId])
);

-- ── Notifications ────────────────────────────────────────────────
CREATE TABLE [Notifications] (
    [NotificationId] BIGINT           IDENTITY(1,1) NOT NULL,
    [UserId]         UNIQUEIDENTIFIER NOT NULL,
    [Title]          NVARCHAR(MAX)    NOT NULL,
    [Message]        NVARCHAR(MAX)    NOT NULL,
    [Type]           NVARCHAR(50)     NOT NULL CONSTRAINT [DF_Notif_Type]   DEFAULT N'Info',
    [RefType]        NVARCHAR(MAX)    NULL,
    [RefId]          UNIQUEIDENTIFIER NULL,
    [IsRead]         BIT              NOT NULL CONSTRAINT [DF_Notif_IsRead] DEFAULT 0,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_Notif_CAt]    DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_Notifications]       PRIMARY KEY ([NotificationId]),
    CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([UserId])
);

-- ── RefreshTokens ────────────────────────────────────────────────
CREATE TABLE [RefreshTokens] (
    [Id]              BIGINT           IDENTITY(1,1) NOT NULL,
    [UserId]          UNIQUEIDENTIFIER NOT NULL,
    [Token]           NVARCHAR(450)    NOT NULL,
    [ExpiresAt]       DATETIME2(7)     NOT NULL,
    [IsRevoked]       BIT              NOT NULL CONSTRAINT [DF_RT_IsRevoked] DEFAULT 0,
    [ReplacedByToken] NVARCHAR(MAX)    NULL,
    [RevokedByIp]     NVARCHAR(MAX)    NULL,
    [CreatedByIp]     NVARCHAR(MAX)    NULL,
    [CreatedAt]       DATETIME2(7)     NOT NULL CONSTRAINT [DF_RT_CAt]       DEFAULT SYSUTCDATETIME(),
    [RevokedAt]       DATETIME2(7)     NULL,
    CONSTRAINT [PK_RefreshTokens]       PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([UserId])
);

-- ── RolePermissions ──────────────────────────────────────────────
CREATE TABLE [RolePermissions] (
    [RoleId]       INT NOT NULL,
    [PermissionId] INT NOT NULL,
    CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
    CONSTRAINT [FK_RP_Roles]        FOREIGN KEY ([RoleId])       REFERENCES [Roles]([RoleId]),
    CONSTRAINT [FK_RP_Permissions]  FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([PermissionId])
);

-- ── AuditLogs ────────────────────────────────────────────────────
CREATE TABLE [AuditLogs] (
    [AuditLogId] BIGINT           IDENTITY(1,1) NOT NULL,
    [UserId]     UNIQUEIDENTIFIER NULL,
    [Action]     NVARCHAR(MAX)    NOT NULL,
    [EntityName] NVARCHAR(MAX)    NOT NULL,
    [EntityId]   NVARCHAR(MAX)    NULL,
    [OldValues]  NVARCHAR(MAX)    NULL,
    [NewValues]  NVARCHAR(MAX)    NULL,
    [IpAddress]  NVARCHAR(MAX)    NULL,
    [UserAgent]  NVARCHAR(MAX)    NULL,
    [CreatedAt]  DATETIME2(7)     NOT NULL CONSTRAINT [DF_AL_CAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([AuditLogId])
);

-- ── PaymentLogs ──────────────────────────────────────────────────
CREATE TABLE [PaymentLogs] (
    [PaymentLogId]   BIGINT           IDENTITY(1,1) NOT NULL,
    [PaymentId]      UNIQUEIDENTIFIER NULL,
    [Gateway]        NVARCHAR(50)     NOT NULL,
    [Direction]      NVARCHAR(50)     NOT NULL,
    [RawRequest]     NVARCHAR(MAX)    NULL,
    [RawResponse]    NVARCHAR(MAX)    NULL,
    [TransactionRef] NVARCHAR(MAX)    NULL,
    [Success]        BIT              NULL,
    [ErrorCode]      NVARCHAR(MAX)    NULL,
    [ErrorMessage]   NVARCHAR(MAX)    NULL,
    [CreatedAt]      DATETIME2(7)     NOT NULL CONSTRAINT [DF_PL_CAt] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_PaymentLogs]          PRIMARY KEY ([PaymentLogId]),
    CONSTRAINT [FK_PaymentLogs_Payments] FOREIGN KEY ([PaymentId]) REFERENCES [Payments]([PaymentId])
);
GO

-- ================================================================
-- 2. TẠO INDEXES
-- ================================================================
CREATE UNIQUE INDEX [IX_Users_Email]              ON [Users]([Email]);
CREATE UNIQUE INDEX [IX_Permissions_Code]         ON [Permissions]([Code]);
CREATE UNIQUE INDEX [IX_Promotions_Code]          ON [Promotions]([Code]);
CREATE UNIQUE INDEX [IX_Coupons_Code]             ON [Coupons]([Code]);
CREATE UNIQUE INDEX [IX_Reviews_BookingId]        ON [Reviews]([BookingId]);
CREATE UNIQUE INDEX [IX_Favorites_UserId_CourtId] ON [Favorites]([UserId], [CourtId]);
CREATE UNIQUE INDEX [IX_RefreshTokens_Token]      ON [RefreshTokens]([Token]);

CREATE INDEX [IX_Courts_BranchId]           ON [Courts]([BranchId]);
CREATE INDEX [IX_Courts_SportTypeId]        ON [Courts]([SportTypeId]);
CREATE INDEX [IX_Courts_CourtTypeId]        ON [Courts]([CourtTypeId]);
CREATE INDEX [IX_Branches_PartnerId]        ON [Branches]([PartnerId]);
CREATE INDEX [IX_Bookings_CustomerId]       ON [Bookings]([CustomerId]);
CREATE INDEX [IX_Bookings_CourtId]          ON [Bookings]([CourtId]);
CREATE INDEX [IX_Bookings_BookingDate]      ON [Bookings]([BookingDate]);
CREATE INDEX [IX_Payments_BookingId]        ON [Payments]([BookingId]);
CREATE INDEX [IX_Payments_UserId]           ON [Payments]([UserId]);
CREATE INDEX [IX_CommissionLedger_PaymentId]ON [CommissionLedger]([PaymentId]);
CREATE INDEX [IX_Reviews_CourtId]           ON [Reviews]([CourtId]);
CREATE INDEX [IX_CourtImages_CourtId]       ON [CourtImages]([CourtId]);
CREATE INDEX [IX_CourtFacilities_CourtId]   ON [CourtFacilities]([CourtId]);
CREATE INDEX [IX_CourtPricingRules_CourtId] ON [CourtPricingRules]([CourtId]);
CREATE INDEX [IX_Schedules_BranchId]        ON [Schedules]([BranchId]);
CREATE INDEX [IX_Holidays_BranchId]         ON [Holidays]([BranchId]);
CREATE INDEX [IX_Coupons_PartnerId]         ON [Coupons]([PartnerId]);
CREATE INDEX [IX_Notifications_UserId]      ON [Notifications]([UserId]);
CREATE INDEX [IX_LoyaltyTransactions_UserId]ON [LoyaltyTransactions]([UserId]);
CREATE INDEX [IX_RefreshTokens_UserId]      ON [RefreshTokens]([UserId]);
CREATE INDEX [IX_PaymentLogs_PaymentId]     ON [PaymentLogs]([PaymentId]);

-- Ghi nhận migration đã áp dụng để EF không chạy lại
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'__EFMigrationsHistory')
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId]    NVARCHAR(150) NOT NULL,
        [ProductVersion] NVARCHAR(32)  NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
SELECT v.[MigrationId], v.[ProductVersion]
FROM (VALUES
    (N'20260626141956_InitialCreate',                N'9.0.6'),
    (N'20260626142142_SeedInitialData',              N'9.0.6'),
    (N'20260628144252_AddUserRefreshToken_RemoveHasData', N'9.0.6'),
    (N'20260628174736_DropCourtTypeId1Shadow',       N'9.0.6')
) AS v([MigrationId], [ProductVersion])
WHERE NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory] h
    WHERE h.[MigrationId] = v.[MigrationId]
);
GO

-- ================================================================
-- 3. DỮ LIỆU DEMO
-- ================================================================
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @PwHash NVARCHAR(100) = N'$2a$11$ZdZUzkGDk0wjkOhEZ6kPA.WQJddtBqudn/5Cr9IRgjrzR9akhsY.S';
DECLARE @Now    DATETIME2(7)  = SYSUTCDATETIME();

-- ── GUIDs cố định ────────────────────────────────────────────────
DECLARE @P_SYS UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000001';
DECLARE @P_HN  UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000002';
DECLARE @P_SG  UNIQUEIDENTIFIER = '10000000-0000-0000-0000-000000000003';

DECLARE @U_SUPER UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000001';
DECLARE @U_OWN1  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000002';
DECLARE @U_OWN2  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000003';
DECLARE @U_MGR1  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000004';
DECLARE @U_MGR2  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000009';
DECLARE @U_STF1  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000005';
DECLARE @U_STF2  UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000006';
DECLARE @U_C1    UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000007';
DECLARE @U_C2    UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000008';
DECLARE @U_C3    UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000011';
DECLARE @U_C4    UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000012';
DECLARE @U_C5    UNIQUEIDENTIFIER = '20000000-0000-0000-0000-000000000013';

DECLARE @B1 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000001';
DECLARE @B2 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000002';
DECLARE @B3 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000003';
DECLARE @B4 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000004';
DECLARE @B5 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000005';
DECLARE @B6 UNIQUEIDENTIFIER = '30000000-0000-0000-0000-000000000006';

DECLARE @C1  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000001';
DECLARE @C2  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000002';
DECLARE @C3  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000003';
DECLARE @C4  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000004';
DECLARE @C5  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000005';
DECLARE @C6  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000006';
DECLARE @C7  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000007';
DECLARE @C8  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000008';
DECLARE @C9  UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000009';
DECLARE @C10 UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000010';
DECLARE @C11 UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000011';
DECLARE @C12 UNIQUEIDENTIFIER = '40000000-0000-0000-0000-000000000012';

DECLARE @PR1 UNIQUEIDENTIFIER = '50000000-0000-0000-0000-000000000001';
DECLARE @PR2 UNIQUEIDENTIFIER = '50000000-0000-0000-0000-000000000002';
DECLARE @PR3 UNIQUEIDENTIFIER = '50000000-0000-0000-0000-000000000003';
DECLARE @MB1 UNIQUEIDENTIFIER = '90000000-0000-0000-0000-000000000001';
DECLARE @MB2 UNIQUEIDENTIFIER = '90000000-0000-0000-0000-000000000002';

DECLARE @BK01 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000001';
DECLARE @BK02 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000002';
DECLARE @BK03 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000003';
DECLARE @BK04 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000004';
DECLARE @BK05 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000005';
DECLARE @BK06 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000006';
DECLARE @BK07 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000007';
DECLARE @BK08 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000008';
DECLARE @BK09 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000009';
DECLARE @BK10 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000010';
DECLARE @BK11 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000011';
DECLARE @BK12 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000012';
DECLARE @BK13 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000013';
DECLARE @BK14 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000014';
DECLARE @BK15 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000015';
DECLARE @BK16 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000016';
DECLARE @BK17 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000017';
DECLARE @BK18 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000018';
DECLARE @BK19 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000019';
DECLARE @BK20 UNIQUEIDENTIFIER = '60000000-0000-0000-0000-000000000020';

DECLARE @PAY01 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000001';
DECLARE @PAY02 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000002';
DECLARE @PAY03 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000003';
DECLARE @PAY04 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000004';
DECLARE @PAY05 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000005';
DECLARE @PAY06 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000006';
DECLARE @PAY07 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000007';
DECLARE @PAY08 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000008';
DECLARE @PAY09 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000009';
DECLARE @PAY10 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000010';
DECLARE @PAY11 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000011';
DECLARE @PAY12 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000012';
DECLARE @PAY13 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000013';
DECLARE @PAY14 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000014';
DECLARE @PAY15 UNIQUEIDENTIFIER = '70000000-0000-0000-0000-000000000015';

DECLARE @RV01 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000001';
DECLARE @RV02 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000002';
DECLARE @RV03 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000003';
DECLARE @RV04 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000004';
DECLARE @RV05 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000005';
DECLARE @RV06 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000006';
DECLARE @RV07 UNIQUEIDENTIFIER = '80000000-0000-0000-0000-000000000007';

DECLARE @MT01 UNIQUEIDENTIFIER = 'A0000000-0000-0000-0000-000000000001';

-- ── 1. Roles ─────────────────────────────────────────────────────
SET IDENTITY_INSERT [Roles] ON;
INSERT INTO [Roles] ([RoleId], [Code], [Name]) VALUES
    (1, N'SuperAdmin',    N'Quản trị viên hệ thống'),
    (2, N'PartnerAdmin',  N'Chủ sân / Đối tác'),
    (3, N'BranchManager', N'Quản lý chi nhánh'),
    (4, N'Staff',         N'Nhân viên'),
    (5, N'Customer',      N'Khách hàng');
SET IDENTITY_INSERT [Roles] OFF;

-- ── 2. SportTypes ────────────────────────────────────────────────
SET IDENTITY_INSERT [SportTypes] ON;
INSERT INTO [SportTypes] ([SportTypeId], [Name], [Icon], [IsActive]) VALUES
    (1, N'Cầu lông',    N'🏸', 1),
    (2, N'Tennis',      N'🎾', 1),
    (3, N'Bóng rổ',    N'🏀', 1),
    (4, N'Bóng đá',    N'⚽', 1),
    (5, N'Bóng chuyền', N'🏐', 1),
    (6, N'Bóng bàn',   N'🏓', 1);
SET IDENTITY_INSERT [SportTypes] OFF;

-- ── 3. CourtTypes ────────────────────────────────────────────────
SET IDENTITY_INSERT [CourtTypes] ON;
INSERT INTO [CourtTypes] ([CourtTypeId], [Name], [Description], [IsActive]) VALUES
    (1, N'Trong nhà',  N'Sân có mái che hoàn toàn, điều hòa', 1),
    (2, N'Ngoài trời', N'Sân ngoài trời thoáng khí',          1),
    (3, N'Bán mái',    N'Sân có mái che một phần',             1);
SET IDENTITY_INSERT [CourtTypes] OFF;

-- ── 4. Banners ───────────────────────────────────────────────────
SET IDENTITY_INSERT [Banners] ON;
INSERT INTO [Banners]
    ([BannerId],[Title],[Subtitle],[ImageUrl],[LinkUrl],[Position],[SortOrder],[IsActive],[StartsAt],[EndsAt],[CreatedAt])
VALUES
    (1, N'Đặt sân cầu lông ưu đãi hè 2026',
     N'Giảm ngay 10% tất cả sân cầu lông tháng 7',
     N'https://picsum.photos/seed/summer2026/1200/400',
     N'/promotions/SUMMER26', N'Home', 1, 1, '2026-06-01', '2026-08-31', @Now),
    (2, N'SportZone khai trương chi nhánh Thủ Đức',
     N'Ưu đãi 30% tuần khai trương 01-07/07/2026',
     N'https://picsum.photos/seed/szthuduc/1200/400',
     N'/branches/30000000-0000-0000-0000-000000000006',
     N'Home', 2, 1, '2026-07-01', '2026-07-07', @Now),
    (3, N'Thành viên VIP — đặc quyền đẳng cấp',
     N'Đăng ký gói thành viên, giảm đến 20% mỗi lần đặt',
     N'https://picsum.photos/seed/membership/1200/400',
     N'/memberships', N'Home', 3, 1, NULL, NULL, @Now);
SET IDENTITY_INSERT [Banners] OFF;

-- ── 5. Partners ──────────────────────────────────────────────────
INSERT INTO [Partners]
    ([PartnerId],[Name],[LegalName],[TaxCode],[ContactEmail],[ContactPhone],
     [LogoUrl],[Website],[CommissionRate],[Status],[ApprovedAt],[ApprovedBy],[CreatedAt],[UpdatedAt])
VALUES
    (@P_SYS, N'SportSG Platform', N'SportSG Platform JSC', N'0100000001',
     N'system@sportsg.com', N'024 3999 0000',
     N'https://placehold.co/200x200/16a34a/ffffff?text=SportSG', N'https://sportsg.vn',
     0.00, N'Active', @Now, @U_SUPER, @Now, @Now),
    (@P_HN, N'BMTC Hà Nội', N'Công ty TNHH BMTC Hà Nội', N'0123456789',
     N'contact@bmtc.vn', N'024 3822 1234',
     N'https://placehold.co/200x200/1d4ed8/ffffff?text=BMTC', N'https://bmtc.vn',
     10.00, N'Active', @Now, @U_SUPER, @Now, @Now),
    (@P_SG, N'SportZone Sài Gòn', N'Công ty CP SportZone', N'0987654321',
     N'contact@sportzone.vn', N'028 3822 5678',
     N'https://placehold.co/200x200/dc2626/ffffff?text=SportZone', N'https://sportzone.vn',
     12.00, N'Active', @Now, @U_SUPER, @Now, @Now);

-- ── 6. Users ─────────────────────────────────────────────────────
INSERT INTO [Users]
    ([UserId],[Email],[PasswordHash],[FirstName],[LastName],[Phone],
     [IsEmailVerified],[IsActive],[Balance],[LoyaltyPoints],[CreatedAt],[UpdatedAt])
VALUES
    (@U_SUPER, N'superadmin@sportsg.com',     @PwHash, N'Super',  N'Admin',  N'0900000001', 1, 1,      0,   0, @Now, @Now),
    (@U_OWN1,  N'owner.hn@bmtc.vn',           @PwHash, N'Minh',   N'Nguyễn', N'0900000002', 1, 1,      0,   0, @Now, @Now),
    (@U_OWN2,  N'owner.sg@sportzone.vn',       @PwHash, N'Lan',    N'Trần',   N'0900000003', 1, 1,      0,   0, @Now, @Now),
    (@U_MGR1,  N'manager.caugiay@bmtc.vn',     @PwHash, N'Hùng',   N'Lê',     N'0900000004', 1, 1,      0,   0, @Now, @Now),
    (@U_MGR2,  N'manager.longbien@bmtc.vn',    @PwHash, N'Tú',     N'Phạm',   N'0900000009', 1, 1,      0,   0, @Now, @Now),
    (@U_STF1,  N'staff1.caugiay@bmtc.vn',      @PwHash, N'Thảo',   N'Phạm',   N'0900000005', 1, 1,      0,   0, @Now, @Now),
    (@U_STF2,  N'staff2.quan1@sportzone.vn',   @PwHash, N'Dũng',   N'Hoàng',  N'0900000006', 1, 1,      0,   0, @Now, @Now),
    (@U_C1,    N'an.nguyen@gmail.com',          @PwHash, N'An',     N'Nguyễn', N'0911111111', 1, 1, 200000, 150, @Now, @Now),
    (@U_C2,    N'binh.tran@gmail.com',          @PwHash, N'Bình',   N'Trần',   N'0922222222', 1, 1,  50000,  80, @Now, @Now),
    (@U_C3,    N'cuong.le@gmail.com',           @PwHash, N'Cường',  N'Lê',     N'0933333333', 1, 1, 100000, 200, @Now, @Now),
    (@U_C4,    N'dung.pham@gmail.com',          @PwHash, N'Dũng',   N'Phạm',   N'0944444444', 1, 1,      0,  30, @Now, @Now),
    (@U_C5,    N'em.vo@gmail.com',              @PwHash, N'Em',     N'Võ',     N'0955555555', 1, 1, 500000, 400, @Now, @Now);

-- ── 7. Branches ──────────────────────────────────────────────────
INSERT INTO [Branches]
    ([BranchId],[PartnerId],[Name],[Address],[City],[District],[Phone],[Email],
     [ImageUrl],[MapUrl],[Latitude],[Longitude],[OpenTime],[CloseTime],[Status],[CreatedAt],[UpdatedAt])
VALUES
    (@B1,@P_HN,N'BMTC Cầu Giấy',
     N'26 Duy Tân, Cầu Giấy',N'Hà Nội',N'Cầu Giấy',
     N'024 3911 0001',N'caugiay@bmtc.vn',
     N'https://picsum.photos/seed/bmtccg/800/500',
     N'https://maps.google.com/?q=BMTC+Cau+Giay',
     21.028511,105.801340,'06:00','22:00',N'Active',@Now,@Now),

    (@B2,@P_HN,N'BMTC Long Biên',
     N'12 Nguyễn Văn Cừ, Long Biên',N'Hà Nội',N'Long Biên',
     N'024 3911 0002',N'longbien@bmtc.vn',
     N'https://picsum.photos/seed/bmtclb/800/500',
     N'https://maps.google.com/?q=BMTC+Long+Bien',
     21.038492,105.875612,'07:00','21:00',N'Active',@Now,@Now),

    (@B3,@P_SG,N'SportZone Quận 1',
     N'88 Lê Lợi, Quận 1',N'Hồ Chí Minh',N'Quận 1',
     N'028 3822 0001',N'quan1@sportzone.vn',
     N'https://picsum.photos/seed/szq1/800/500',
     N'https://maps.google.com/?q=SportZone+Q1+HCM',
     10.773031,106.700562,'06:00','23:00',N'Active',@Now,@Now),

    (@B4,@P_SG,N'SportZone Quận 7',
     N'20 Nguyễn Thị Thập, Quận 7',N'Hồ Chí Minh',N'Quận 7',
     N'028 3822 0002',N'quan7@sportzone.vn',
     N'https://picsum.photos/seed/szq7/800/500',
     N'https://maps.google.com/?q=SportZone+Q7+HCM',
     10.732511,106.718451,'06:00','22:00',N'Active',@Now,@Now),

    (@B5,@P_HN,N'BMTC Hoàng Mai',
     N'5 Giải Phóng, Hoàng Mai',N'Hà Nội',N'Hoàng Mai',
     N'024 3911 0003',N'hoangmai@bmtc.vn',
     N'https://picsum.photos/seed/bmtchm/800/500',
     NULL,20.989410,105.844830,'07:00','21:00',N'Active',@Now,@Now),

    (@B6,@P_SG,N'SportZone Thủ Đức',
     N'100 Võ Văn Ngân, Thủ Đức',N'Hồ Chí Minh',N'Thủ Đức',
     N'028 3822 0003',N'thuduc@sportzone.vn',
     N'https://picsum.photos/seed/sztd/800/500',
     NULL,10.851210,106.754830,'06:00','22:00',N'Active',@Now,@Now);

-- ── 8. BranchSportTypes ──────────────────────────────────────────
INSERT INTO [BranchSportTypes] ([BranchId],[SportTypeId]) VALUES
    (@B1,1),(@B1,2),
    (@B2,1),(@B2,6),
    (@B3,1),(@B3,2),(@B3,3),
    (@B4,1),(@B4,4),
    (@B5,1),(@B5,5),(@B5,6),
    (@B6,1),(@B6,2),(@B6,3);

-- ── 9. PartnerUserRoles ──────────────────────────────────────────
SET IDENTITY_INSERT [PartnerUserRoles] ON;
INSERT INTO [PartnerUserRoles]
    ([Id],[UserId],[PartnerId],[BranchId],[RoleId],[IsActive],[CreatedAt])
VALUES
    (1,@U_SUPER,@P_SYS,NULL,1,1,@Now),
    (2,@U_OWN1, @P_HN, NULL,2,1,@Now),
    (3,@U_OWN2, @P_SG, NULL,2,1,@Now),
    (4,@U_MGR1, @P_HN, @B1, 3,1,@Now),
    (5,@U_MGR2, @P_HN, @B2, 3,1,@Now),
    (6,@U_STF1, @P_HN, @B1, 4,1,@Now),
    (7,@U_STF2, @P_SG, @B3, 4,1,@Now);
SET IDENTITY_INSERT [PartnerUserRoles] OFF;

-- ── 10. Memberships ──────────────────────────────────────────────
INSERT INTO [Memberships]
    ([MembershipId],[PartnerId],[Name],[Description],
     [Price],[DurationDays],[DiscountPercent],[LoyaltyMultiplier],[IsActive],[CreatedAt])
VALUES
    (@MB1,@P_HN,N'Thành viên Bạc BMTC',
     N'Giảm 10% mỗi lần đặt sân tại BMTC. Tích điểm x1.5',
     299000,30,10.00,1.50,1,@Now),
    (@MB2,@P_HN,N'Thành viên Vàng BMTC',
     N'Giảm 20% mỗi lần đặt. Tích điểm x2. Ưu tiên giờ cao điểm',
     599000,30,20.00,2.00,1,@Now);

-- ── 11. Promotions ───────────────────────────────────────────────
INSERT INTO [Promotions]
    ([PromotionId],[PartnerId],[Code],[Name],[Description],
     [DiscountType],[DiscountValue],[MinOrderAmount],[MaxDiscount],
     [UsageLimit],[UsageCount],[ValidFrom],[ValidTo],[IsActive],[CreatedAt])
VALUES
    (@PR1,NULL,N'SUMMER26',N'Khuyến mãi Hè 2026',
     N'Giảm 10% cho mỗi đơn đặt sân từ 100,000đ. Tối đa giảm 50,000đ.',
     N'Percent',10.00,100000.00,50000.00,1000,47,
     '2026-06-01','2026-08-31',1,@Now),
    (@PR2,@P_HN,N'BMTCVIP',N'Ưu đãi VIP BMTC',
     N'Giảm 50,000đ cho đơn từ 150,000đ tại hệ thống BMTC.',
     N'Fixed',50000.00,150000.00,NULL,200,28,
     '2026-01-01','2026-12-31',1,@Now),
    (@PR3,@P_SG,N'ZONE15',N'SportZone Tân Bình 15%',
     N'Giảm 15% áp dụng sân cầu lông và tennis SportZone. Tối đa 80,000đ.',
     N'Percent',15.00,80000.00,80000.00,500,12,
     '2026-06-15','2026-07-15',1,@Now);

-- ── 12. Coupons ──────────────────────────────────────────────────
SET IDENTITY_INSERT [Coupons] ON;
INSERT INTO [Coupons]
    ([CouponId],[PartnerId],[Code],[DiscountType],[DiscountValue],
     [MinOrderAmount],[MaxDiscount],[UsageLimit],[UsageCount],[ValidFrom],[ValidTo],[IsActive],[CreatedAt])
VALUES
    (1,NULL,  N'WELCOME50',N'Fixed',  50000,100000,NULL, 50, 3,'2026-06-01','2026-12-31',1,@Now),
    (2,@P_HN, N'BMTC10',  N'Percent',10,    80000,30000,100,15,'2026-06-01','2026-09-30',1,@Now),
    (3,@P_SG, N'SZ20K',   N'Fixed',  20000, 60000,NULL, 200, 7,'2026-07-01','2026-07-31',1,@Now);
SET IDENTITY_INSERT [Coupons] OFF;

-- ── 13. Courts ───────────────────────────────────────────────────
INSERT INTO [Courts]
    ([CourtId],[BranchId],[SportTypeId],[CourtTypeId],[Name],[Description],
     [BasePrice],[Capacity],[Status],[CreatedAt],[UpdatedAt])
VALUES
    (@C1, @B1,1,1,N'Sân Cầu Lông 01',N'Sân tiêu chuẩn thi đấu, nền gỗ trải thảm PU',            80000, 4,N'Active',     @Now,@Now),
    (@C2, @B1,1,1,N'Sân Cầu Lông 02',N'Sân cầu lông mới nâng cấp 2025, điều hòa trung tâm',      80000, 4,N'Active',     @Now,@Now),
    (@C3, @B1,2,1,N'Sân Tennis 01',  N'Sân tennis mặt cứng Plexicushion, ánh sáng LED 1500lux',  160000, 4,N'Active',     @Now,@Now),
    (@C4, @B2,1,3,N'Sân Cầu Lông 01',N'Sân cầu lông bán mái rộng rãi, điều hòa khu vực',          70000, 4,N'Active',     @Now,@Now),
    (@C5, @B2,6,1,N'Sân Bóng Bàn 01',N'4 bàn bóng bàn tiêu chuẩn ITTF, nền chống trơn',           50000, 2,N'Active',     @Now,@Now),
    (@C6, @B3,1,1,N'Sân Cầu Lông 01',N'Sân cao cấp điều hòa trung tâm, nền gỗ tổng hợp',         100000, 4,N'Active',     @Now,@Now),
    (@C7, @B3,2,1,N'Sân Tennis 01',  N'Sân tennis đạt chuẩn quốc tế ITF, đèn LED',               200000, 4,N'Active',     @Now,@Now),
    (@C8, @B3,3,1,N'Sân Bóng Rổ 01', N'Sân bóng rổ 5vs5, nền gỗ kết hợp nhựa PU',               120000,10,N'Maintenance',@Now,@Now),
    (@C9, @B4,1,2,N'Sân Cầu Lông 01',N'Sân cầu lông ngoài trời, mái che chống nắng',               60000, 4,N'Active',     @Now,@Now),
    (@C10,@B4,4,2,N'Sân Bóng Đá 5v5',N'Sân cỏ nhân tạo 5v5 thế hệ thứ 3',                       200000,10,N'Active',     @Now,@Now),
    (@C11,@B5,1,3,N'Sân Cầu Lông 01',N'Sân cầu lông bán mái, gió tự nhiên thoáng mát',             65000, 4,N'Active',     @Now,@Now),
    (@C12,@B5,5,2,N'Sân Bóng Chuyền',N'Sân bóng chuyền ngoài trời tiêu chuẩn FIVB',               80000,12,N'Active',     @Now,@Now);

-- ── 14. CourtImages ──────────────────────────────────────────────
SET IDENTITY_INSERT [CourtImages] ON;
INSERT INTO [CourtImages]
    ([CourtImageId],[CourtId],[Url],[PublicId],[IsPrimary],[SortOrder],[CreatedAt])
VALUES
    (1, @C1, N'https://picsum.photos/seed/court1a/600/400',N'courts/c1-1', 1,1,@Now),
    (2, @C1, N'https://picsum.photos/seed/court1b/600/400',N'courts/c1-2', 0,2,@Now),
    (3, @C2, N'https://picsum.photos/seed/court2a/600/400',N'courts/c2-1', 1,1,@Now),
    (4, @C3, N'https://picsum.photos/seed/court3a/600/400',  N'courts/c3-1', 1,1,@Now),
    (5, @C3, N'https://picsum.photos/seed/court3b/600/400',  N'courts/c3-2', 0,2,@Now),
    (6, @C4, N'https://picsum.photos/seed/court4a/600/400',N'courts/c4-1',1,1,@Now),
    (7, @C5, N'https://picsum.photos/seed/court5a/600/400',N'courts/c5-1',1,1,@Now),
    (8, @C6, N'https://picsum.photos/seed/court6a/600/400', N'courts/c6-1', 1,1,@Now),
    (9, @C6, N'https://picsum.photos/seed/court6b/600/400', N'courts/c6-2', 0,2,@Now),
    (10,@C7, N'https://picsum.photos/seed/court7a/600/400',    N'courts/c7-1', 1,1,@Now),
    (11,@C8, N'https://picsum.photos/seed/court8a/600/400',  N'courts/c8-1', 1,1,@Now),
    (12,@C9, N'https://picsum.photos/seed/court9a/600/400', N'courts/c9-1', 1,1,@Now),
    (13,@C10,N'https://picsum.photos/seed/court10a/600/400',   N'courts/c10-1',1,1,@Now),
    (14,@C11,N'https://picsum.photos/seed/court11a/600/400',N'courts/c11-1',1,1,@Now),
    (15,@C12,N'https://picsum.photos/seed/court12a/600/400',N'courts/c12-1',1,1,@Now);
SET IDENTITY_INSERT [CourtImages] OFF;

-- ── 15. CourtFacilities ──────────────────────────────────────────
SET IDENTITY_INSERT [CourtFacilities] ON;
INSERT INTO [CourtFacilities] ([CourtFacilityId],[CourtId],[Name],[Icon]) VALUES
    (1, @C1, N'Điều hòa',             N'AC'),
    (2, @C1, N'Bãi đỗ xe',            N'P'),
    (3, @C1, N'Phòng thay đồ',        N'WR'),
    (4, @C2, N'Điều hòa',             N'AC'),
    (5, @C2, N'Bãi đỗ xe',            N'P'),
    (6, @C3, N'Đèn LED cao cấp',      N'LED'),
    (7, @C3, N'Điều hòa',             N'AC'),
    (8, @C3, N'Phòng thay đồ',        N'WR'),
    (9, @C4, N'Điều hòa khu vực',     N'AC'),
    (10,@C4, N'Bãi đỗ xe',            N'P'),
    (11,@C5, N'Điều hòa',             N'AC'),
    (12,@C6, N'Điều hòa trung tâm',   N'AC'),
    (13,@C6, N'Bãi đỗ xe hầm',        N'P'),
    (14,@C6, N'Cho thuê vợt',         N'RT'),
    (15,@C7, N'Đèn LED 1500lux',      N'LED'),
    (16,@C7, N'Ghế khán giả',         N'ST'),
    (17,@C7, N'Bãi đỗ xe hầm',        N'P'),
    (18,@C9, N'Mái che chống nắng',   N'SH'),
    (19,@C10,N'Cỏ nhân tạo thế hệ 3', N'TF'),
    (20,@C10,N'Hệ thống tưới tự động',N'SW');
SET IDENTITY_INSERT [CourtFacilities] OFF;

-- ── 16. CourtPricingRules ────────────────────────────────────────
SET IDENTITY_INSERT [CourtPricingRules] ON;
INSERT INTO [CourtPricingRules]
    ([RuleId],[CourtId],[DayOfWeek],[StartTime],[EndTime],[Price],[Label],[IsActive])
VALUES
    (1, @C1, NULL,'17:00','21:00',104000,N'Giờ cao điểm (+30%)',1),
    (2, @C2, NULL,'17:00','21:00',104000,N'Giờ cao điểm (+30%)',1),
    (3, @C3, NULL,'17:00','21:00',208000,N'Giờ cao điểm (+30%)',1),
    (4, @C3, 6,  '06:00','21:00',200000,N'Cuối tuần - Thứ 7',  1),
    (5, @C3, 0,  '06:00','21:00',200000,N'Cuối tuần - CN',     1),
    (6, @C4, NULL,'17:00','21:00', 91000,N'Giờ cao điểm (+30%)',1),
    (7, @C6, NULL,'17:00','21:00',130000,N'Giờ cao điểm (+30%)',1),
    (8, @C7, NULL,'17:00','21:00',260000,N'Giờ cao điểm (+30%)',1),
    (9, @C7, 6,  '06:00','21:00',250000,N'Cuối tuần',          1),
    (10,@C7, 0,  '06:00','21:00',250000,N'Cuối tuần',          1);
SET IDENTITY_INSERT [CourtPricingRules] OFF;

-- ── 17. Schedules ────────────────────────────────────────────────
SET IDENTITY_INSERT [Schedules] ON;
INSERT INTO [Schedules] ([ScheduleId],[BranchId],[DayOfWeek],[OpenTime],[CloseTime],[IsClosed]) VALUES
    -- B1 BMTC Cầu Giấy
    (1, @B1,1,'06:00','22:00',0),(2, @B1,2,'06:00','22:00',0),(3, @B1,3,'06:00','22:00',0),
    (4, @B1,4,'06:00','22:00',0),(5, @B1,5,'06:00','22:00',0),(6, @B1,6,'06:00','22:00',0),
    (7, @B1,0,'07:00','22:00',0),
    -- B2 BMTC Long Biên
    (8, @B2,1,'07:00','21:00',0),(9, @B2,2,'07:00','21:00',0),(10,@B2,3,'07:00','21:00',0),
    (11,@B2,4,'07:00','21:00',0),(12,@B2,5,'07:00','21:00',0),(13,@B2,6,'07:00','21:00',0),
    (14,@B2,0,'08:00','20:00',0),
    -- B3 SportZone Quận 1
    (15,@B3,1,'06:00','23:00',0),(16,@B3,2,'06:00','23:00',0),(17,@B3,3,'06:00','23:00',0),
    (18,@B3,4,'06:00','23:00',0),(19,@B3,5,'06:00','23:00',0),(20,@B3,6,'06:00','23:00',0),
    (21,@B3,0,'07:00','22:00',0);
SET IDENTITY_INSERT [Schedules] OFF;

-- ── 18. Holidays ─────────────────────────────────────────────────
SET IDENTITY_INSERT [Holidays] ON;
INSERT INTO [Holidays] ([HolidayId],[BranchId],[Date],[Reason],[IsRecurringYearly]) VALUES
    (1,NULL,'2026-01-01',N'Tết Dương lịch',             1),
    (2,NULL,'2026-01-28',N'Tết Nguyên Đán (29 Tết)',   0),
    (3,NULL,'2026-01-29',N'Tết Nguyên Đán (30 Tết)',   0),
    (4,NULL,'2026-01-30',N'Tết Nguyên Đán (Mùng 1)',   0),
    (5,NULL,'2026-04-30',N'Giải phóng Miền Nam',        1),
    (6,NULL,'2026-05-01',N'Quốc tế Lao Động',           1),
    (7,NULL,'2026-09-02',N'Quốc khánh',                 1),
    (8,@B3, '2026-07-15',N'Bảo trì hệ thống điện định kỳ',0);
SET IDENTITY_INSERT [Holidays] OFF;

-- ── 19. MaintenanceSchedules ─────────────────────────────────────
INSERT INTO [MaintenanceSchedules]
    ([MaintenanceId],[CourtId],[StartTime],[EndTime],[Reason],[Status],[CreatedBy],[CreatedAt])
VALUES
    (@MT01,@C8,
     '2026-06-25 08:00:00','2026-07-05 18:00:00',
     N'Sửa chữa hệ thống đèn chiếu sáng và lát lại nền sân',
     N'InProgress',@U_MGR1,DATEADD(DAY,-3,@Now));

-- ── 20. Bookings ─────────────────────────────────────────────────
-- Trạng thái: CheckedOut=hoàn thành | CheckedIn=đang chơi | Confirmed=đã TT chưa đến | Pending=chưa TT | Cancelled | NoShow
INSERT INTO [Bookings]
    ([BookingId],[CustomerId],[CourtId],[BookingDate],[StartTime],[EndTime],
     [DurationMinutes],[BaseAmount],[DiscountAmount],[TotalAmount],
     [Note],[Status],[CancelReason],[CreatedBy],[ConfirmedBy],[PromotionId],[CreatedAt],[UpdatedAt])
VALUES
    (@BK01,@U_C1,@C1,'2026-06-18','08:00','10:00',120,160000,    0,160000,NULL,                           N'CheckedOut',NULL,NULL,@U_STF1,NULL,                    DATEADD(DAY,-10,@Now),DATEADD(DAY,-10,@Now)),
    (@BK02,@U_C2,@C3,'2026-06-20','14:00','16:00',120,320000,32000,288000,N'Đặt kèm mã SUMMER26',        N'CheckedOut',NULL,NULL,@U_MGR1,@PR1,                    DATEADD(DAY,-8,@Now), DATEADD(DAY,-8,@Now)),
    (@BK03,@U_C3,@C4,'2026-06-21','08:00','10:00',120,140000,    0,140000,NULL,                           N'CheckedOut',NULL,NULL,@U_STF1,NULL,                    DATEADD(DAY,-7,@Now), DATEADD(DAY,-7,@Now)),
    (@BK04,@U_C4,@C6,'2026-06-22','10:00','12:00',120,200000,    0,200000,NULL,                           N'CheckedOut',NULL,NULL,@U_STF2,NULL,                    DATEADD(DAY,-6,@Now), DATEADD(DAY,-6,@Now)),
    (@BK05,@U_C5,@C7,'2026-06-23','09:00','11:00',120,400000,60000,340000,N'Sân VIP, đặt trước 2 ngày',  N'CheckedOut',NULL,NULL,@U_STF2,@PR3,                    DATEADD(DAY,-5,@Now), DATEADD(DAY,-5,@Now)),
    (@BK06,@U_C1,@C2,'2026-06-24','17:00','19:00',120,208000,    0,208000,N'Nhóm 4 người',               N'CheckedOut',NULL,NULL,@U_STF1,NULL,                    DATEADD(DAY,-4,@Now), DATEADD(DAY,-4,@Now)),
    (@BK07,@U_C2,@C5,'2026-06-25','08:00','09:00', 60, 50000,    0, 50000,NULL,                           N'CheckedOut',NULL,NULL,@U_MGR2,NULL,                    DATEADD(DAY,-3,@Now), DATEADD(DAY,-3,@Now)),
    (@BK08,@U_C3,@C1,'2026-06-27','06:00','08:00',120,160000,16000,144000,N'Mã BMTCVIP',                 N'CheckedOut',NULL,NULL,@U_STF1,@PR2,                    DATEADD(DAY,-1,@Now), DATEADD(DAY,-1,@Now)),
    (@BK09,@U_C4,@C1,'2026-06-28','08:00','10:00',120,160000,    0,160000,NULL,                           N'CheckedIn', NULL,NULL,@U_STF1,NULL,                    DATEADD(HOUR,-3,@Now),@Now),
    (@BK10,@U_C1,@C4,'2026-06-28','09:00','11:00',120,140000,    0,140000,N'Khách vãng lai',             N'CheckedIn', NULL,@U_MGR2,@U_MGR2,NULL,                 DATEADD(HOUR,-2,@Now),@Now),
    (@BK11,@U_C5,@C6,'2026-06-28','10:00','12:00',120,200000,    0,200000,NULL,                           N'CheckedIn', NULL,NULL,@U_STF2,NULL,                    DATEADD(HOUR,-1,@Now),@Now),
    (@BK12,@U_C1,@C2,'2026-06-29','09:00','11:00',120,160000,    0,160000,NULL,                           N'Confirmed', NULL,NULL,@U_STF1,NULL,                    DATEADD(HOUR,-5,@Now),@Now),
    (@BK13,@U_C4,@C7,'2026-06-29','14:00','16:00',120,400000,60000,340000,N'Đặt kèm mã ZONE15',          N'Confirmed', NULL,NULL,@U_STF2,@PR3,                    DATEADD(HOUR,-4,@Now),@Now),
    (@BK14,@U_C2,@C3,'2026-06-30','08:00','10:00',120,320000,32000,288000,N'Đặt kèm mã SUMMER26',        N'Confirmed', NULL,NULL,@U_MGR1,@PR1,                    DATEADD(HOUR,-6,@Now),@Now),
    (@BK15,@U_C3,@C11,'2026-06-29','17:00','19:00',120,130000,   0,130000,NULL,                           N'Confirmed', NULL,NULL,@U_STF1,NULL,                    DATEADD(HOUR,-3,@Now),@Now),
    (@BK16,@U_C5,@C1,'2026-06-29','08:00','10:00',120,160000,    0,160000,NULL,                           N'Pending',   NULL,NULL,NULL,NULL,                       DATEADD(HOUR,-2,@Now),@Now),
    (@BK17,@U_C2,@C6,'2026-06-30','10:00','12:00',120,200000,    0,200000,NULL,                           N'Pending',   NULL,NULL,NULL,NULL,                       DATEADD(HOUR,-1,@Now),@Now),
    (@BK18,@U_C4,@C9,'2026-07-01','09:00','11:00',120,120000,    0,120000,NULL,                           N'Pending',   NULL,NULL,NULL,NULL,                       @Now,@Now),
    (@BK19,@U_C1,@C7,'2026-06-22','10:00','12:00',120,400000,    0,400000,NULL,                           N'Cancelled', N'Khách bận đột xuất, hủy trước 24h',NULL,NULL,NULL,DATEADD(DAY,-7,@Now),DATEADD(DAY,-6,@Now)),
    (@BK20,@U_C3,@C5,'2026-06-21','14:00','15:00', 60, 50000,    0, 50000,NULL,                           N'NoShow',    NULL,NULL,@U_MGR2,NULL,                    DATEADD(DAY,-8,@Now), DATEADD(DAY,-7,@Now));

-- ── 21. Payments ─────────────────────────────────────────────────
INSERT INTO [Payments]
    ([PaymentId],[BookingId],[UserId],[Amount],[Method],[Status],
     [TransactionRef],[GatewayResponse],[PaidAt],[CreatedAt])
VALUES
    (@PAY01,@BK01,@U_C1,160000,N'Cash',  N'Success',N'CASH-BK01',          NULL,DATEADD(DAY,-10,@Now),DATEADD(DAY,-10,@Now)),
    (@PAY02,@BK02,@U_C2,288000,N'VNPay', N'Success',N'VNPAY-20260620-BK02',NULL,DATEADD(DAY,-8,@Now), DATEADD(DAY,-9,@Now)),
    (@PAY03,@BK03,@U_C3,140000,N'MoMo',  N'Success',N'MOMO-20260621-BK03', NULL,DATEADD(DAY,-7,@Now), DATEADD(DAY,-7,@Now)),
    (@PAY04,@BK04,@U_C4,200000,N'Cash',  N'Success',N'CASH-BK04',          NULL,DATEADD(DAY,-6,@Now), DATEADD(DAY,-6,@Now)),
    (@PAY05,@BK05,@U_C5,340000,N'VNPay', N'Success',N'VNPAY-20260623-BK05',NULL,DATEADD(DAY,-5,@Now), DATEADD(DAY,-6,@Now)),
    (@PAY06,@BK06,@U_C1,208000,N'Wallet',N'Success',N'WALLET-BK06',        NULL,DATEADD(DAY,-4,@Now), DATEADD(DAY,-4,@Now)),
    (@PAY07,@BK07,@U_C2, 50000,N'Cash',  N'Success',N'CASH-BK07',          NULL,DATEADD(DAY,-3,@Now), DATEADD(DAY,-3,@Now)),
    (@PAY08,@BK08,@U_C3,144000,N'MoMo',  N'Success',N'MOMO-20260627-BK08', NULL,DATEADD(DAY,-1,@Now), DATEADD(DAY,-1,@Now)),
    (@PAY09,@BK12,@U_C1,160000,N'VNPay', N'Success',N'VNPAY-20260628-BK12',NULL,DATEADD(HOUR,-4,@Now),DATEADD(HOUR,-5,@Now)),
    (@PAY10,@BK13,@U_C4,340000,N'MoMo',  N'Success',N'MOMO-20260628-BK13', NULL,DATEADD(HOUR,-3,@Now),DATEADD(HOUR,-4,@Now)),
    (@PAY11,@BK14,@U_C2,288000,N'VNPay', N'Success',N'VNPAY-20260628-BK14',NULL,DATEADD(HOUR,-5,@Now),DATEADD(HOUR,-6,@Now)),
    (@PAY12,@BK15,@U_C3,130000,N'Cash',  N'Success',N'CASH-BK15',          NULL,DATEADD(HOUR,-2,@Now),DATEADD(HOUR,-3,@Now)),
    (@PAY13,@BK09,@U_C4,160000,N'Cash',  N'Pending',NULL,                  NULL,NULL,@Now),
    (@PAY14,@BK10,@U_C1,140000,N'Cash',  N'Pending',NULL,                  NULL,NULL,@Now),
    (@PAY15,@BK11,@U_C5,200000,N'Cash',  N'Pending',NULL,                  NULL,NULL,@Now);

-- ── 22. CommissionLedger ─────────────────────────────────────────
SET IDENTITY_INSERT [CommissionLedger] ON;
INSERT INTO [CommissionLedger]
    ([Id],[PaymentId],[PartnerId],[GrossAmount],[CommissionRate],[CommissionAmt],[NetAmount],[CreatedAt])
VALUES
    -- BMTC HN (10%)
    (1, @PAY01,@P_HN,160000,10.00, 16000,144000,DATEADD(DAY,-10,@Now)),
    (2, @PAY02,@P_HN,288000,10.00, 28800,259200,DATEADD(DAY,-8,@Now)),
    (3, @PAY03,@P_HN,140000,10.00, 14000,126000,DATEADD(DAY,-7,@Now)),
    (4, @PAY06,@P_HN,208000,10.00, 20800,187200,DATEADD(DAY,-4,@Now)),
    (5, @PAY07,@P_HN, 50000,10.00,  5000, 45000,DATEADD(DAY,-3,@Now)),
    (6, @PAY08,@P_HN,144000,10.00, 14400,129600,DATEADD(DAY,-1,@Now)),
    (7, @PAY09,@P_HN,160000,10.00, 16000,144000,DATEADD(HOUR,-4,@Now)),
    (8, @PAY11,@P_HN,288000,10.00, 28800,259200,DATEADD(HOUR,-5,@Now)),
    (9, @PAY12,@P_HN,130000,10.00, 13000,117000,DATEADD(HOUR,-2,@Now)),
    -- SportZone SG (12%)
    (10,@PAY04,@P_SG,200000,12.00, 24000,176000,DATEADD(DAY,-6,@Now)),
    (11,@PAY05,@P_SG,340000,12.00, 40800,299200,DATEADD(DAY,-5,@Now)),
    (12,@PAY10,@P_SG,340000,12.00, 40800,299200,DATEADD(HOUR,-3,@Now));
SET IDENTITY_INSERT [CommissionLedger] OFF;

-- ── 23. Reviews ──────────────────────────────────────────────────
INSERT INTO [Reviews]
    ([ReviewId],[BookingId],[UserId],[CourtId],[Rating],[Comment],[ImageUrls],
     [IsVisible],[ReplyContent],[RepliedAt],[CreatedAt])
VALUES
    (@RV01,@BK01,@U_C1,@C1,5,
     N'Sân rất đẹp, nhân viên nhiệt tình, điều hòa mát. Sẽ quay lại!',
     NULL,1,N'Cảm ơn bạn đã trải nghiệm! Hẹn gặp lại.',
     DATEADD(HOUR,2,DATEADD(DAY,-10,@Now)),DATEADD(HOUR,1,DATEADD(DAY,-10,@Now))),
    (@RV02,@BK02,@U_C2,@C3,4,
     N'Sân tennis chất lượng tốt, ánh sáng đầy đủ. Bãi đỗ xe hơi chật.',
     NULL,1,NULL,NULL,DATEADD(DAY,-8,@Now)),
    (@RV03,@BK03,@U_C3,@C4,5,
     N'Sân Long Biên thoáng mát, giá hợp lý, nhân viên thân thiện!',
     NULL,1,N'Cảm ơn bạn! Hẹn gặp lại tại BMTC Long Biên.',
     DATEADD(HOUR,3,DATEADD(DAY,-7,@Now)),DATEADD(HOUR,2,DATEADD(DAY,-7,@Now))),
    (@RV04,@BK04,@U_C4,@C6,4,
     N'SportZone Quận 1 xịn, điều hòa cực mát. Chỉ hơi khó đặt giờ cao điểm.',
     NULL,1,NULL,NULL,DATEADD(DAY,-6,@Now)),
    (@RV05,@BK05,@U_C5,@C7,3,
     N'Sân tennis đẹp nhưng giá cao. Nhân viên ok. Mong có thêm ưu đãi khách quen.',
     NULL,1,N'Cảm ơn phản hồi! Chúng tôi sẽ cân nhắc thêm gói ưu đãi khách thân thiết.',
     DATEADD(HOUR,4,DATEADD(DAY,-5,@Now)),DATEADD(DAY,-5,@Now)),
    (@RV06,@BK06,@U_C1,@C2,5,
     N'Sân 02 mới nâng cấp đẹp lắm, nền thảm êm, điều hòa mát. Rất hài lòng!',
     NULL,1,NULL,NULL,DATEADD(DAY,-4,@Now)),
    (@RV07,@BK08,@U_C3,@C1,4,
     N'Giờ sáng sớm yên tĩnh, sân sạch sẽ. Hơi thiếu chỗ để đồ cá nhân.',
     NULL,1,NULL,NULL,DATEADD(DAY,-1,@Now));

-- ── 24. Favorites ────────────────────────────────────────────────
SET IDENTITY_INSERT [Favorites] ON;
INSERT INTO [Favorites] ([FavoriteId],[UserId],[CourtId],[CreatedAt]) VALUES
    (1,@U_C1,@C1, DATEADD(DAY,-5,@Now)),
    (2,@U_C1,@C3, DATEADD(DAY,-3,@Now)),
    (3,@U_C1,@C6, DATEADD(DAY,-2,@Now)),
    (4,@U_C2,@C3, DATEADD(DAY,-4,@Now)),
    (5,@U_C2,@C7, DATEADD(DAY,-1,@Now)),
    (6,@U_C3,@C4, DATEADD(DAY,-6,@Now)),
    (7,@U_C4,@C6, DATEADD(DAY,-2,@Now)),
    (8,@U_C5,@C7, DATEADD(DAY,-7,@Now)),
    (9,@U_C5,@C1, DATEADD(DAY,-3,@Now));
SET IDENTITY_INSERT [Favorites] OFF;

-- ── 25. Notifications ────────────────────────────────────────────
SET IDENTITY_INSERT [Notifications] ON;
INSERT INTO [Notifications]
    ([NotificationId],[UserId],[Title],[Message],[Type],[RefType],[RefId],[IsRead],[CreatedAt])
VALUES
    (1,@U_C1,N'Đặt sân thành công',
     N'Bạn đã đặt sân Cầu Lông 02 vào 09:00 ngày 29/06/2026. Mã đặt: BK12.',
     N'Booking',N'Booking',@BK12,1,DATEADD(HOUR,-5,@Now)),
    (2,@U_C1,N'Thanh toán thành công',
     N'Thanh toán 160,000đ cho booking BK12 đã được xác nhận qua VNPay.',
     N'Payment',N'Payment',@PAY09,1,DATEADD(HOUR,-4,@Now)),
    (3,@U_C2,N'Đặt sân thành công',
     N'Bạn đã đặt sân Tennis 01 vào 08:00 ngày 30/06/2026. Mã đặt: BK14.',
     N'Booking',N'Booking',@BK14,1,DATEADD(HOUR,-6,@Now)),
    (4,@U_C4,N'Nhắc nhở đặt sân',
     N'Sân Tennis 01 (SportZone Q1) của bạn bắt đầu lúc 14:00 ngày 29/06/2026. Hãy đến đúng giờ!',
     N'Booking',N'Booking',@BK13,0,DATEADD(MINUTE,-30,@Now)),
    (5,@U_C5,N'Đặt sân thành công',
     N'Bạn đã đặt sân Cầu Lông 01 vào 08:00 ngày 29/06/2026. Mã đặt: BK16.',
     N'Booking',N'Booking',@BK16,0,DATEADD(HOUR,-2,@Now)),
    (6,@U_C5,N'Thanh toán đang chờ',
     N'Vui lòng hoàn tất thanh toán cho booking BK16 trong vòng 15 phút.',
     N'Payment',N'Booking',@BK16,0,DATEADD(HOUR,-2,@Now)),
    (7,@U_C3,N'Đặt sân thành công',
     N'Sân Cầu Lông 01 (BMTC Hoàng Mai) đã được xác nhận lúc 17:00 ngày 29/06/2026.',
     N'Booking',N'Booking',@BK15,0,DATEADD(HOUR,-3,@Now)),
    (8,@U_C1,N'Khuyến mãi hè 2026',
     N'Dùng mã SUMMER26 để giảm 10% đơn đặt sân từ 100,000đ. Áp dụng đến 31/08/2026!',
     N'Info',NULL,NULL,0,DATEADD(DAY,-1,@Now));
SET IDENTITY_INSERT [Notifications] OFF;

-- ── 26. LoyaltyTransactions ──────────────────────────────────────
SET IDENTITY_INSERT [LoyaltyTransactions] ON;
INSERT INTO [LoyaltyTransactions]
    ([Id],[UserId],[Points],[Type],[RefType],[RefId],[Note],[CreatedAt])
VALUES
    (1, @U_C1, 16, N'Earn', N'Booking',@BK01,N'Tích điểm từ booking BK01',DATEADD(DAY,-10,@Now)),
    (2, @U_C2, 29, N'Earn', N'Booking',@BK02,N'Tích điểm từ booking BK02',DATEADD(DAY,-8,@Now)),
    (3, @U_C3, 14, N'Earn', N'Booking',@BK03,N'Tích điểm từ booking BK03',DATEADD(DAY,-7,@Now)),
    (4, @U_C4, 20, N'Earn', N'Booking',@BK04,N'Tích điểm từ booking BK04',DATEADD(DAY,-6,@Now)),
    (5, @U_C5, 34, N'Earn', N'Booking',@BK05,N'Tích điểm từ booking BK05',DATEADD(DAY,-5,@Now)),
    (6, @U_C1, 21, N'Earn', N'Booking',@BK06,N'Tích điểm từ booking BK06',DATEADD(DAY,-4,@Now)),
    (7, @U_C2,  5, N'Earn', N'Booking',@BK07,N'Tích điểm từ booking BK07',DATEADD(DAY,-3,@Now)),
    (8, @U_C3, 14, N'Earn', N'Booking',@BK08,N'Tích điểm từ booking BK08',DATEADD(DAY,-1,@Now)),
    (9, @U_C1, 16, N'Earn', N'Booking',@BK12,N'Tích điểm từ booking BK12',DATEADD(HOUR,-4,@Now)),
    (10,@U_C4, 34, N'Earn', N'Booking',@BK13,N'Tích điểm từ booking BK13',DATEADD(HOUR,-3,@Now)),
    (11,@U_C2, 29, N'Earn', N'Booking',@BK14,N'Tích điểm từ booking BK14',DATEADD(HOUR,-5,@Now)),
    (12,@U_C3, 13, N'Earn', N'Booking',@BK15,N'Tích điểm từ booking BK15',DATEADD(HOUR,-2,@Now)),
    (13,@U_C5,-200,N'Redeem',NULL,      NULL, N'Đổi 200 điểm lấy 20,000đ giảm giá',DATEADD(DAY,-15,@Now)),
    (14,@U_C5,500, N'Bonus',NULL,       NULL, N'Thưởng thành viên mới tháng 5/2026',DATEADD(DAY,-45,@Now));
SET IDENTITY_INSERT [LoyaltyTransactions] OFF;

COMMIT TRANSACTION;

-- ================================================================
-- TỔNG KẾT
-- ================================================================
PRINT N'';
PRINT N'================================================================';
PRINT N'  SportSG - Demo data da nap thanh cong!';
PRINT N'================================================================';
PRINT N'  Mat khau tat ca tai khoan: password';
PRINT N'';
PRINT N'  Email                           | Vai tro';
PRINT N'  --------------------------------|------------------------';
PRINT N'  superadmin@sportsg.com          | SuperAdmin';
PRINT N'  owner.hn@bmtc.vn                | PartnerAdmin (BMTC HN)';
PRINT N'  owner.sg@sportzone.vn           | PartnerAdmin (SportZone)';
PRINT N'  manager.caugiay@bmtc.vn         | BranchManager (Cau Giay)';
PRINT N'  manager.longbien@bmtc.vn        | BranchManager (Long Bien)';
PRINT N'  staff1.caugiay@bmtc.vn          | Staff';
PRINT N'  staff2.quan1@sportzone.vn       | Staff';
PRINT N'  an.nguyen / binh.tran / cuong.le| Customer';
PRINT N'  dung.pham / em.vo @gmail.com    | Customer';
PRINT N'================================================================';
