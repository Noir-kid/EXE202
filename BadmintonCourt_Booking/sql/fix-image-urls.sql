-- ================================================================
-- FIX IMAGE URLs — Thay cdn.sportsg.vn bằng picsum.photos
-- Chạy script này trên DB hiện tại (KHÔNG xóa dữ liệu).
-- ================================================================
USE SportSGDb;

-- Branches
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/bmtccg/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/bmtc-caugiay.jpg';
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/bmtclb/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/bmtc-longbien.jpg';
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/szq1/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/sportzone-q1.jpg';
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/szq7/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/sportzone-q7.jpg';
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/bmtchm/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/bmtc-hoangmai.jpg';
UPDATE [Branches] SET [ImageUrl] = 'https://picsum.photos/seed/sztd/800/500'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/branches/sportzone-thuduc.jpg';

-- Partners (LogoUrl)
UPDATE [Partners] SET [LogoUrl] = 'https://placehold.co/200x200/16a34a/ffffff?text=SportSG'
    WHERE [LogoUrl] = 'https://cdn.sportsg.vn/logos/sportsg.png';
UPDATE [Partners] SET [LogoUrl] = 'https://placehold.co/200x200/1d4ed8/ffffff?text=BMTC'
    WHERE [LogoUrl] = 'https://cdn.sportsg.vn/logos/bmtc.png';
UPDATE [Partners] SET [LogoUrl] = 'https://placehold.co/200x200/dc2626/ffffff?text=SportZone'
    WHERE [LogoUrl] = 'https://cdn.sportsg.vn/logos/sportzone.png';

-- Banners
UPDATE [Banners] SET [ImageUrl] = 'https://picsum.photos/seed/summer2026/1200/400'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/banners/summer2026.jpg';
UPDATE [Banners] SET [ImageUrl] = 'https://picsum.photos/seed/szthuduc/1200/400'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/banners/sportzone-thuduc.jpg';
UPDATE [Banners] SET [ImageUrl] = 'https://picsum.photos/seed/membership/1200/400'
    WHERE [ImageUrl] = 'https://cdn.sportsg.vn/banners/membership-vip.jpg';

-- CourtImages
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court1a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-cg-badminton01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court1b/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-cg-badminton01-2.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court2a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-cg-badminton02-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court3a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-cg-tennis01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court3b/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-cg-tennis01-2.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court4a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-lb-badminton01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court5a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-lb-tabletennis-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court6a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q1-badminton01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court6b/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q1-badminton01-2.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court7a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q1-tennis01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court8a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q1-basketball-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court9a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q7-badminton01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court10a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/sz-q7-football5-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court11a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-hm-badminton01-1.jpg';
UPDATE [CourtImages] SET [Url] = 'https://picsum.photos/seed/court12a/600/400'
    WHERE [Url] = 'https://cdn.sportsg.vn/courts/bmtc-hm-volleyball-1.jpg';

-- Verify: không còn cdn.sportsg.vn nào
SELECT 'Branches'    AS [Table], COUNT(*) AS [Remaining] FROM [Branches]    WHERE [ImageUrl] LIKE '%cdn.sportsg.vn%'
UNION ALL
SELECT 'Partners',                COUNT(*)                FROM [Partners]    WHERE [LogoUrl]  LIKE '%cdn.sportsg.vn%'
UNION ALL
SELECT 'Banners',                 COUNT(*)                FROM [Banners]     WHERE [ImageUrl] LIKE '%cdn.sportsg.vn%'
UNION ALL
SELECT 'CourtImages',             COUNT(*)                FROM [CourtImages] WHERE [Url]      LIKE '%cdn.sportsg.vn%';
