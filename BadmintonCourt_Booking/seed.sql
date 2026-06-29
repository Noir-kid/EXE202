-- ============================================================
--  SportSG – SEED DATA (SQL Server)
--  Mật khẩu admin : Admin@123
--  Mật khẩu customer: User@123
--  Hash được tạo bởi BCrypt.Net-Next cost=11
--
--  Chạy trong SSMS sau khi đã chạy "dotnet ef database update"
--  (migrations phải đã tạo bảng sẵn)
-- ============================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

-- ── Xóa dữ liệu cũ (theo thứ tự FK) ────────────────────────
DELETE FROM Reviews;
DELETE FROM CommissionLedger;
DELETE FROM Payments;
DELETE FROM Bookings;
DELETE FROM Promotions;
DELETE FROM CourtPricingRules;
DELETE FROM Courts;
DELETE FROM BranchSportTypes;
DELETE FROM MaintenanceSchedules;
DELETE FROM PartnerUserRoles;
DELETE FROM UserMemberships;
DELETE FROM Memberships;
DELETE FROM LoyaltyTransactions;
DELETE FROM Notifications;
DELETE FROM Branches;
DELETE FROM Users;
DELETE FROM Partners;
-- Roles & SportTypes do NOT delete — seeded by EF migration

-- ============================================================
-- 1. PARTNERS
-- ============================================================
INSERT INTO Partners
    (PartnerId, Name, LegalName, TaxCode, ContactEmail, ContactPhone,
     LogoUrl, Website, CommissionRate, Status, ApprovedAt, CreatedAt, UpdatedAt)
VALUES
-- Đối tác hệ thống (dùng cho SuperAdmin)
('10000000-0000-0000-0000-000000000001',
 'SportSG Platform', 'SportSG Platform', NULL,
 'system@sportsg.com', NULL, NULL, NULL,
 0.00, 'Active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()),

-- Đối tác 1: BMTC Hà Nội
('10000000-0000-0000-0000-000000000002',
 'BMTC Hà Nội', 'Công ty TNHH BMTC Hà Nội', '0123456789',
 'contact@bmtc.vn', '024 3822 1234', NULL, 'https://bmtc.vn',
 10.00, 'Active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()),

-- Đối tác 2: SportZone Sài Gòn
('10000000-0000-0000-0000-000000000003',
 'SportZone Sài Gòn', 'Công ty CP SportZone', '0987654321',
 'contact@sportzone.vn', '028 3822 5678', NULL, NULL,
 12.00, 'Active', GETUTCDATE(), GETUTCDATE(), GETUTCDATE());

-- ============================================================
-- 2. USERS
--    Admin@123 → $2a$11$9IZ052ED3w5gi8UZP9I/Q.SV6GXEt.yTdKuNr8ytM.KDUpHKnE.hG
--    User@123  → $2a$11$//fFW1J1U.g4V0RKZSfvh.Bm8Ek9rmkMmt2i9BrPW3fylT6e.tiK2
-- ============================================================
DECLARE @hashAdmin NVARCHAR(72) = '$2a$11$9IZ052ED3w5gi8UZP9I/Q.SV6GXEt.yTdKuNr8ytM.KDUpHKnE.hG';
DECLARE @hashUser  NVARCHAR(72) = '$2a$11$//fFW1J1U.g4V0RKZSfvh.Bm8Ek9rmkMmt2i9BrPW3fylT6e.tiK2';

INSERT INTO Users
    (UserId, Email, PasswordHash, IsEmailVerified, GoogleId, AvatarUrl,
     Phone, FirstName, LastName, Balance, LoyaltyPoints, IsActive, CreatedAt, UpdatedAt)
VALUES
-- 1. SuperAdmin
('20000000-0000-0000-0000-000000000001',
 'superadmin@sportsg.com', @hashAdmin, 1, NULL, NULL,
 '0900000001', 'Super', 'Admin', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 2. PartnerAdmin – BMTC HN
('20000000-0000-0000-0000-000000000002',
 'owner.hn@bmtc.vn', @hashAdmin, 1, NULL, NULL,
 '0900000002', 'Minh', 'Nguyễn', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 3. PartnerAdmin – SportZone SG
('20000000-0000-0000-0000-000000000003',
 'owner.sg@sportzone.vn', @hashAdmin, 1, NULL, NULL,
 '0900000003', 'Lan', 'Trần', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 4. BranchManager – Cầu Giấy
('20000000-0000-0000-0000-000000000004',
 'manager.caugiay@bmtc.vn', @hashAdmin, 1, NULL, NULL,
 '0900000004', 'Hùng', 'Lê', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 5. Staff – Cầu Giấy
('20000000-0000-0000-0000-000000000005',
 'staff1.caugiay@bmtc.vn', @hashAdmin, 1, NULL, NULL,
 '0900000005', 'Thảo', 'Phạm', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 6. Staff – Long Biên
('20000000-0000-0000-0000-000000000006',
 'staff2.longbien@bmtc.vn', @hashAdmin, 1, NULL, NULL,
 '0900000006', 'Dũng', 'Hoàng', 0, 0, 1, GETUTCDATE(), GETUTCDATE()),

-- 7. Customer 1
('20000000-0000-0000-0000-000000000007',
 'an.nguyen@gmail.com', @hashUser, 1, NULL, NULL,
 '0911111111', 'An', 'Nguyễn', 200000, 150, 1, GETUTCDATE(), GETUTCDATE()),

-- 8. Customer 2
('20000000-0000-0000-0000-000000000008',
 'binh.tran@gmail.com', @hashUser, 1, NULL, NULL,
 '0922222222', 'Bình', 'Trần', 50000, 80, 1, GETUTCDATE(), GETUTCDATE());

-- ============================================================
-- 3. BRANCHES  (phải trước PartnerUserRoles vì PUR có FK → Branches)
-- ============================================================
INSERT INTO Branches
    (BranchId, PartnerId, Name, Address, City, District,
     Phone, Email, ImageUrl, MapUrl,
     OpenTime, CloseTime, Status, CreatedAt, UpdatedAt)
VALUES
-- B1: BMTC Cầu Giấy (P_HN)
('30000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000002',
 'BMTC Cầu Giấy', '26 Duy Tân, Cầu Giấy', 'Hà Nội', 'Cầu Giấy',
 '024 3911 0001', 'caugiay@bmtc.vn', NULL, NULL,
 '06:00:00', '22:00:00', 'Active', GETUTCDATE(), GETUTCDATE()),

-- B2: BMTC Long Biên (P_HN)
('30000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002',
 'BMTC Long Biên', '12 Nguyễn Văn Cừ, Long Biên', 'Hà Nội', 'Long Biên',
 '024 3911 0002', 'longbien@bmtc.vn', NULL, NULL,
 '07:00:00', '21:00:00', 'Active', GETUTCDATE(), GETUTCDATE()),

-- B3: SportZone Quận 1 (P_SG)
('30000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000003',
 'SportZone Quận 1', '88 Lê Lợi, Quận 1', 'Hồ Chí Minh', 'Quận 1',
 '028 3822 0001', 'quan1@sportzone.vn', NULL, NULL,
 '06:00:00', '23:00:00', 'Active', GETUTCDATE(), GETUTCDATE());

-- ============================================================
-- 4. BRANCH SPORT TYPES
-- ============================================================
INSERT INTO BranchSportTypes (BranchId, SportTypeId) VALUES
-- B1: Cầu lông + Tennis
('30000000-0000-0000-0000-000000000001', 1),
('30000000-0000-0000-0000-000000000001', 2),
-- B2: Cầu lông + Bóng bàn
('30000000-0000-0000-0000-000000000002', 1),
('30000000-0000-0000-0000-000000000002', 6),
-- B3: Cầu lông + Tennis + Bóng rổ
('30000000-0000-0000-0000-000000000003', 1),
('30000000-0000-0000-0000-000000000003', 2),
('30000000-0000-0000-0000-000000000003', 3);

-- ============================================================
-- 5. PARTNER USER ROLES
--    RoleId: 1=SuperAdmin, 2=PartnerAdmin, 3=BranchManager,
--            4=Staff,      5=Customer
--    Customer KHÔNG có bản ghi → GetPrimaryRoleAsync trả về "Customer"
-- ============================================================
INSERT INTO PartnerUserRoles
    (UserId, PartnerId, BranchId, RoleId, IsActive, CreatedAt)
VALUES
-- SuperAdmin → P_SYSTEM
('20000000-0000-0000-0000-000000000001',
 '10000000-0000-0000-0000-000000000001', NULL, 1, 1, GETUTCDATE()),

-- PartnerAdmin BMTC HN → P_HN (không gắn branch cụ thể)
('20000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002', NULL, 2, 1, GETUTCDATE()),

-- PartnerAdmin SportZone SG → P_SG
('20000000-0000-0000-0000-000000000003',
 '10000000-0000-0000-0000-000000000003', NULL, 2, 1, GETUTCDATE()),

-- BranchManager → P_HN, Branch Cầu Giấy
('20000000-0000-0000-0000-000000000004',
 '10000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000001', 3, 1, GETUTCDATE()),

-- Staff 1 → P_HN, Branch Cầu Giấy
('20000000-0000-0000-0000-000000000005',
 '10000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000001', 4, 1, GETUTCDATE()),

-- Staff 2 → P_HN, Branch Long Biên
('20000000-0000-0000-0000-000000000006',
 '10000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000002', 4, 1, GETUTCDATE());

-- ============================================================
-- 6. COURTS
--    SportTypeId: 1=Cầu lông, 2=Tennis, 3=Bóng rổ, 6=Bóng bàn
-- ============================================================
INSERT INTO Courts
    (CourtId, BranchId, SportTypeId, Name, Description,
     ImageUrls, BasePrice, Status, CreatedAt, UpdatedAt)
VALUES
-- B1 – Cầu Giấy
('40000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001', 1,
 'Sân Cầu Lông 01', 'Sân tiêu chuẩn thi đấu, nền gỗ trải thảm',
 NULL, 80000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

('40000000-0000-0000-0000-000000000002',
 '30000000-0000-0000-0000-000000000001', 1,
 'Sân Cầu Lông 02', 'Sân mới nâng cấp năm 2024, điều hoà',
 NULL, 80000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

('40000000-0000-0000-0000-000000000003',
 '30000000-0000-0000-0000-000000000001', 2,
 'Sân Tennis 01', 'Sân tennis mặt cứng, hệ thống chiếu sáng 1500 lux',
 NULL, 150000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

-- B2 – Long Biên
('40000000-0000-0000-0000-000000000004',
 '30000000-0000-0000-0000-000000000002', 1,
 'Sân Cầu Lông 01', 'Sân rộng rãi, điều hoà trung tâm',
 NULL, 70000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

('40000000-0000-0000-0000-000000000005',
 '30000000-0000-0000-0000-000000000002', 6,
 'Sân Bóng Bàn 01', '4 bàn bóng bàn tiêu chuẩn ITTF',
 NULL, 50000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

-- B3 – Quận 1
('40000000-0000-0000-0000-000000000006',
 '30000000-0000-0000-0000-000000000003', 1,
 'Sân Cầu Lông 01', 'Sân cao cấp, điều hoà trung tâm, nền Yonex',
 NULL, 100000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

('40000000-0000-0000-0000-000000000007',
 '30000000-0000-0000-0000-000000000003', 2,
 'Sân Tennis 01', 'Sân tennis đạt chuẩn ITF quốc tế',
 NULL, 200000.00, 'Active', GETUTCDATE(), GETUTCDATE()),

('40000000-0000-0000-0000-000000000008',
 '30000000-0000-0000-0000-000000000003', 3,
 'Sân Bóng Rổ 01', 'Sân bóng rổ 5vs5, nền parquet nhập khẩu',
 NULL, 120000.00, 'Maintenance', GETUTCDATE(), GETUTCDATE());

-- ============================================================
-- 7. PROMOTIONS
-- ============================================================
INSERT INTO Promotions
    (PromotionId, PartnerId, Code, Name, Description,
     DiscountType, DiscountValue, MinOrderAmount, MaxDiscount,
     UsageLimit, UsageCount, ValidFrom, ValidTo, IsActive, CreatedAt)
VALUES
-- Platform-wide: 10% off, min 100k, max 50k
('50000000-0000-0000-0000-000000000001',
 NULL, 'SUMMER25', 'Khuyến mãi Hè 2025',
 'Giảm 10% cho đơn từ 100,000đ. Tối đa giảm 50,000đ.',
 'Percent', 10.00, 100000.00, 50000.00,
 500, 37, '2025-05-01', '2025-09-30', 1, GETUTCDATE()),

-- BMTC HN only: giảm cố định 50k, min 150k
('50000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000002',
 'BMTCVIP', 'Ưu đãi VIP BMTC',
 'Giảm 50,000đ cho đơn từ 150,000đ tại BMTC Hà Nội.',
 'Fixed', 50000.00, 150000.00, NULL,
 100, 12, '2025-01-01', '2025-12-31', 1, GETUTCDATE());

-- ============================================================
-- 8. BOOKINGS
--    Dùng DATEADD thay vì hardcode ngày
-- ============================================================
DECLARE @yesterday DATE = CAST(DATEADD(DAY,-1,GETDATE()) AS DATE);
DECLARE @today     DATE = CAST(GETDATE() AS DATE);
DECLARE @tomorrow  DATE = CAST(DATEADD(DAY, 1,GETDATE()) AS DATE);
DECLARE @dayAfter  DATE = CAST(DATEADD(DAY, 2,GETDATE()) AS DATE);

INSERT INTO Bookings
    (BookingId, CustomerId, CourtId, BookingDate, StartTime, EndTime,
     DurationMinutes, BaseAmount, DiscountAmount, TotalAmount,
     Note, Status, CancelReason, CreatedBy, ConfirmedBy, PromotionId,
     CreatedAt, UpdatedAt)
VALUES
-- BK1: Customer1 đặt Cầu Lông 01 (B1) hôm qua 08-10h → CheckedOut
('60000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000007',
 '40000000-0000-0000-0000-000000000001',
 @yesterday, '08:00:00', '10:00:00', 120,
 160000.00, 0.00, 160000.00,
 'Mang vợt theo', 'CheckedOut', NULL,
 NULL, '20000000-0000-0000-0000-000000000005',
 NULL, DATEADD(DAY,-2,GETUTCDATE()), DATEADD(DAY,-1,GETUTCDATE())),

-- BK2: Customer1 đặt Cầu Lông 02 (B1) ngày mai 09-11h → Confirmed
('60000000-0000-0000-0000-000000000002',
 '20000000-0000-0000-0000-000000000007',
 '40000000-0000-0000-0000-000000000002',
 @tomorrow, '09:00:00', '11:00:00', 120,
 160000.00, 0.00, 160000.00,
 NULL, 'Confirmed', NULL,
 NULL, '20000000-0000-0000-0000-000000000005',
 NULL, DATEADD(DAY,-1,GETUTCDATE()), GETUTCDATE()),

-- BK3: Customer2 đặt Tennis 01 (B1) hôm qua 14-16h → CheckedOut
('60000000-0000-0000-0000-000000000003',
 '20000000-0000-0000-0000-000000000008',
 '40000000-0000-0000-0000-000000000003',
 @yesterday, '14:00:00', '16:00:00', 120,
 300000.00, 0.00, 300000.00,
 NULL, 'CheckedOut', NULL,
 NULL, '20000000-0000-0000-0000-000000000004',
 NULL, DATEADD(DAY,-3,GETUTCDATE()), DATEADD(DAY,-1,GETUTCDATE())),

-- BK4: Customer2 đặt Cầu Lông 01 (B3) ngày kia 10-12h → Pending
('60000000-0000-0000-0000-000000000004',
 '20000000-0000-0000-0000-000000000008',
 '40000000-0000-0000-0000-000000000006',
 @dayAfter, '10:00:00', '12:00:00', 120,
 200000.00, 0.00, 200000.00,
 NULL, 'Pending', NULL,
 NULL, NULL, NULL, GETUTCDATE(), GETUTCDATE()),

-- BK5: Walk-in hôm nay bởi Staff2 cho Customer1 tại Cầu Lông B2 15-17h → CheckedIn
('60000000-0000-0000-0000-000000000005',
 '20000000-0000-0000-0000-000000000007',
 '40000000-0000-0000-0000-000000000004',
 @today, '15:00:00', '17:00:00', 120,
 140000.00, 0.00, 140000.00,
 'Khách vãng lai', 'CheckedIn', NULL,
 '20000000-0000-0000-0000-000000000006',
 '20000000-0000-0000-0000-000000000006',
 NULL, GETUTCDATE(), GETUTCDATE());

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
INSERT INTO Payments
    (PaymentId, BookingId, UserId, Amount, Method, Status,
     TransactionRef, GatewayResponse, PaidAt, RefundedAt, RefundReason, CreatedAt)
VALUES
-- Pay1: BK1 → Cash, thành công
('70000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000007',
 160000.00, 'Cash', 'Success', 'CASH-BK1-001', NULL,
 DATEADD(DAY,-1,GETUTCDATE()), NULL, NULL,
 DATEADD(DAY,-1,GETUTCDATE())),

-- Pay2: BK3 → Cash, thành công
('70000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000003',
 '20000000-0000-0000-0000-000000000008',
 300000.00, 'Cash', 'Success', 'CASH-BK3-001', NULL,
 DATEADD(DAY,-1,GETUTCDATE()), NULL, NULL,
 DATEADD(DAY,-1,GETUTCDATE())),

-- Pay3: BK5 → Cash, walk-in hôm nay, thành công
('70000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000005',
 '20000000-0000-0000-0000-000000000007',
 140000.00, 'Cash', 'Success', 'CASH-BK5-001', NULL,
 GETUTCDATE(), NULL, NULL, GETUTCDATE()),

-- Pay4: BK2 → Pending (ngày mai, chưa thanh toán)
('70000000-0000-0000-0000-000000000004',
 '60000000-0000-0000-0000-000000000002',
 '20000000-0000-0000-0000-000000000007',
 160000.00, 'Cash', 'Pending', NULL, NULL,
 NULL, NULL, NULL,
 DATEADD(DAY,-1,GETUTCDATE()));

-- ============================================================
-- 10. REVIEWS
--     Chỉ cho booking có status = CheckedOut
-- ============================================================
INSERT INTO Reviews
    (ReviewId, BookingId, UserId, CourtId, Rating, Comment,
     ImageUrls, IsVisible, ReplyContent, RepliedAt, CreatedAt)
VALUES
-- Review BK1 – Customer1 đánh giá Cầu Lông 01 (B1)
('80000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000007',
 '40000000-0000-0000-0000-000000000001',
 5, 'Sân rất đẹp, nhân viên nhiệt tình. Sẽ quay lại lần sau!',
 NULL, 1, NULL, NULL,
 DATEADD(DAY,-1,GETUTCDATE())),

-- Review BK3 – Customer2 đánh giá Tennis 01 (B1)
('80000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000003',
 '20000000-0000-0000-0000-000000000008',
 '40000000-0000-0000-0000-000000000003',
 4, 'Sân tennis chất lượng tốt, ánh sáng đầy đủ. Bãi đỗ xe hơi chật.',
 NULL, 1, NULL, NULL,
 DATEADD(DAY,-1,GETUTCDATE()));

COMMIT TRANSACTION;

PRINT '=== Seed hoàn tất ===';
PRINT 'Tài khoản demo:';
PRINT '  superadmin@sportsg.com    / Admin@123  → SuperAdmin';
PRINT '  owner.hn@bmtc.vn          / Admin@123  → PartnerAdmin (BMTC HN)';
PRINT '  owner.sg@sportzone.vn     / Admin@123  → PartnerAdmin (SportZone SG)';
PRINT '  manager.caugiay@bmtc.vn   / Admin@123  → BranchManager (Cầu Giấy)';
PRINT '  staff1.caugiay@bmtc.vn    / Admin@123  → Staff (Cầu Giấy)';
PRINT '  staff2.longbien@bmtc.vn   / Admin@123  → Staff (Long Biên)';
PRINT '  an.nguyen@gmail.com        / User@123   → Customer';
PRINT '  binh.tran@gmail.com        / User@123   → Customer';
