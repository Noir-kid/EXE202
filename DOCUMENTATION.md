# SportSG — Tài liệu Toàn Bộ Dự Án

> Cập nhật lần cuối: 2026-07-01

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Cấu Trúc Repository](#2-cấu-trúc-repository)
3. [Backend: SportSG API (Clean Architecture)](#3-backend-sportsg-api-clean-architecture)
   - 3.1 [Cấu trúc Solution](#31-cấu-trúc-solution)
   - 3.2 [Domain Layer](#32-domain-layer)
   - 3.3 [Application Layer](#33-application-layer)
   - 3.4 [Infrastructure Layer](#34-infrastructure-layer)
   - 3.5 [API Layer](#35-api-layer)
   - 3.6 [Middleware Pipeline](#36-middleware-pipeline)
   - 3.7 [Xác Thực & Phân Quyền](#37-xác-thực--phân-quyền)
   - 3.8 [Background Jobs (Hangfire)](#38-background-jobs-hangfire)
   - 3.9 [Real-time (SignalR)](#39-real-time-signalr)
   - 3.10 [Cấu Hình & Biến Môi Trường](#310-cấu-hình--biến-môi-trường)
4. [Frontend: React Web App](#4-frontend-react-web-app)
5. [Mobile: Flutter App](#5-mobile-flutter-app)
6. [Database Schema](#6-database-schema)
7. [Luồng Nghiệp Vụ Chính](#7-luồng-nghiệp-vụ-chính)
8. [Cổng Thanh Toán](#8-cổng-thanh-toán)
9. [Hạ Tầng & Triển Khai](#9-hạ-tầng--triển-khai)
10. [Backend Cũ (Tham Khảo)](#10-backend-cũ-tham-khảo)
11. [Lưu Ý Quan Trọng Cho Developer](#11-lưu-ý-quan-trọng-cho-developer)

---

## 1. Tổng Quan Hệ Thống

**SportSG** là nền tảng SaaS đặt sân thể thao đa đối tác (multi-tenant). Hệ thống cho phép nhiều đối tác kinh doanh (Partner) quản lý chi nhánh (Branch) và sân (Court) của họ, trong khi khách hàng (Customer) có thể tìm kiếm, đặt sân và thanh toán trực tuyến.

### Các thành phần chính

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **SportSG API** | ASP.NET Core 8, Clean Architecture | Backend chính, REST API |
| **React Web App** | React 18, MUI, Ant Design | Giao diện web cho cả khách hàng và admin |
| **Flutter Mobile** | Flutter / Dart | Ứng dụng di động cho khách hàng |
| **SQL Server** | SQL Server / EF Core 8 | Cơ sở dữ liệu chính |
| **Redis** (tùy chọn) | StackExchange.Redis | Cache phân tán (fallback sang MemoryCache) |
| **Hangfire** | Hangfire + SQL Server | Background jobs (hết hạn đặt sân, nhắc nhở) |
| **SignalR** | ASP.NET Core SignalR | Thông báo real-time |
| **Cloudinary** | Cloudinary SDK | Lưu trữ ảnh sân / chi nhánh |

### URL Mặc Định (Dev)

| Dịch vụ | URL |
|---|---|
| SportSG API (HTTPS) | `https://localhost:62116` |
| SportSG API (HTTP) | `http://localhost:5000` |
| Swagger UI | `https://localhost:62116/swagger` |
| Hangfire Dashboard | `https://localhost:62116/jobs` |
| React Web App | `http://localhost:3000` |
| Flutter (Android Emulator) | Gọi API qua `https://10.0.2.2:62116` |

---

## 2. Cấu Trúc Repository

```
EXE202/
├── BadmintonCourt_Booking/        # Solution SportSG (backend chính)
│   ├── SportSG.API/               # ASP.NET Core Web API, entry point
│   ├── SportSG.Application/       # Use cases, service interfaces, DTOs
│   ├── SportSG.Domain/            # Entities, Enums (không dependency ngoài)
│   ├── SportSG.Infrastructure/    # EF Core, services bên ngoài
│   └── SportSG.sln
│
├── src/                           # React Web App (Create React App)
│   ├── App.js                     # Bảng route chính
│   ├── Components/                # Shared components
│   └── Scene/                     # Các màn hình theo tính năng
│
├── mobile_flutter/                # Flutter mobile app
│   └── lib/
│       ├── main.dart
│       ├── core/                  # config, network, session
│       ├── features/              # màn hình theo tính năng
│       └── shared/                # widget dùng chung
│
├── public/                        # CRA public assets
├── server/db.json                 # JSON-server mock (chỉ dùng khi dev)
├── docker-compose.yml
├── nginx.conf
├── frontend-nginx.conf
├── BadmintonCourt.sql             # Script DB cũ
├── demoScript.sql
├── official.sql
├── package.json                   # Scripts npm cho React frontend
└── PROJECT_CONTEXT.md             # Tóm tắt cũ (tham khảo)
```

> **Lưu ý:** Thư mục `API/` ở gốc là placeholder, không chứa code. Backend cũ (BadmintonCourt namespace) vẫn còn trong git history nhưng code hiện tại đã được refactor hoàn toàn sang namespace `SportSG`.

---

## 3. Backend: SportSG API (Clean Architecture)

### 3.1 Cấu Trúc Solution

Solution sử dụng **Clean Architecture** với 4 project tách biệt theo dependency rule:

```
SportSG.Domain          ← không phụ thuộc project nào khác
    ↑
SportSG.Application     ← phụ thuộc Domain
    ↑
SportSG.Infrastructure  ← phụ thuộc Application + Domain
    ↑
SportSG.API             ← phụ thuộc tất cả, là entry point
```

### 3.2 Domain Layer

**`SportSG.Domain`** — Chứa entities và enums thuần túy, không có dependency framework.

#### Entities Chính

| Entity | Mô tả |
|---|---|
| `User` | Tài khoản người dùng: email, password hash, Google OAuth, avatar (Cloudinary), balance, loyalty points, refresh tokens |
| `Partner` | Đối tác kinh doanh: tên công ty, tax code, commission rate, trạng thái phê duyệt |
| `Branch` | Chi nhánh của Partner: địa chỉ, tọa độ GPS, giờ mở cửa, sport types |
| `Court` | Sân thể thao: loại sport, giá cơ bản, pricing rules theo giờ/ngày, hình ảnh, tiện ích |
| `Booking` | Đặt sân: thời gian, giá, trạng thái, promotion áp dụng, người tạo |
| `Payment` | Giao dịch thanh toán: phương thức, trạng thái, transaction ref, commission ledger |
| `Review` | Đánh giá sân sau khi đặt |
| `Promotion` | Mã giảm giá: Percent/Fixed, giới hạn sử dụng, thời hạn, partner-specific hoặc toàn hệ thống |
| `Membership` | Gói hội viên của partner: discount %, loyalty multiplier |
| `Notification` | Thông báo in-app per user |
| `Schedule` | Lịch hoạt động weekly của branch (giờ mở/đóng theo từng thứ) |
| `Holiday` | Ngày nghỉ đặc biệt / bảo trì (per-branch hoặc platform-wide) |
| `AuditLog` | Log mọi thao tác mutating (INSERT/UPDATE/DELETE) |
| `PartnerUserRole` | Bảng giao vai trò User trong một Partner (multi-role per tenant) |
| `CourtPricingRule` | Giá giờ cao điểm/thấp điểm per sân |

#### Enums

```csharp
PartnerStatus:  Pending | Active | Suspended | Rejected
BranchStatus:   Active | Closed | Maintenance
CourtStatus:    Active | Maintenance | Inactive
BookingStatus:  Pending | Confirmed | CheckedIn | CheckedOut | Cancelled | NoShow
PaymentMethod:  MoMo | VNPay | Cash | Wallet
PaymentStatus:  Pending | Success | Failed | Refunded
DiscountType:   Percent | Fixed
MembershipStatus: Active | Expired | Cancelled
NotificationType: Info | Booking | Payment | System
```

#### Hệ Thống Vai Trò (Roles)

```csharp
SuperAdmin     // Admin toàn hệ thống
PartnerAdmin   // Quản trị viên của một Partner cụ thể
BranchManager  // Quản lý một Branch trong Partner
Staff          // Nhân viên tại một Branch
Customer       // Khách hàng đặt sân
```

> Vai trò không gắn trực tiếp vào User mà thông qua bảng `PartnerUserRole`. Một User có thể là Staff tại Branch A và BranchManager tại Branch B (thuộc cùng hoặc khác Partner), nhưng chỉ có thể là PartnerAdmin của 1 Partner tại một thời điểm.

---

### 3.3 Application Layer

**`SportSG.Application`** — Interfaces và implementations của business logic.

#### Services

| Service | Interface | Triển khai |
|---|---|---|
| Auth | `IAuthService` | `AuthService.cs` |
| Booking | `IBookingService` | `BookingService.cs` |
| Dashboard | `IDashboardService` | `DashboardService.cs` |
| Favorite | `IFavoriteService` | `FavoriteService.cs` |

#### Infrastructure Interfaces (định nghĩa ở Application)

```
ICacheService       — get/set/delete cache (Redis hoặc Memory)
IEmailService       — gửi email SMTP
IGoogleAuthProvider — validate Google id_token
INotificationHub    — gửi SignalR notification tới user
IPaymentGateway     — tạo URL thanh toán (VNPay / MoMo)
IUploadService      — upload ảnh lên Cloudinary
```

#### DTOs

Tổ chức theo feature trong `SportSG.Application/DTOs/`:
- `Auth/` — RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse, RefreshRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
- `Booking/` — CreateBookingRequest, BookingFilterRequest, UpdateBookingStatusRequest, BookingResponse, AvailableSlotResponse
- `Dashboard/` — SuperAdminDashboardDto, PartnerAdminDashboardDto, BranchManagerDashboardDto, StaffDashboardDto, RevenueReportDto

#### Repository Pattern

```
IRepository<T>      — CRUD cơ bản: GetByIdAsync, FindAsync, AddAsync, Update, Remove, AnyAsync, CountAsync, Query()
IUnitOfWork         — truy cập tất cả repositories + SaveChangesAsync
```

---

### 3.4 Infrastructure Layer

**`SportSG.Infrastructure`** — Cài đặt cụ thể cho persistence và third-party services.

#### Data

- **`AppDbContext`** — EF Core DbContext với SQL Server. Cấu hình fluent mapping cho tất cả entities. Mọi enum lưu dưới dạng string trong DB.
- **`DataSeeder`** — Seed dữ liệu mẫu khi chạy Development (role definitions, sport types, 1 SuperAdmin).
- **`Repository<T>` / `UnitOfWork`** — Generic repository + unit of work pattern.

#### External Services

| File | Dịch vụ |
|---|---|
| `EmailService.cs` | SMTP email qua Gmail (587/STARTTLS) |
| `CloudinaryUploadService.cs` | Upload/xóa ảnh trên Cloudinary |
| `GoogleAuthProvider.cs` | Validate Google id_token qua HTTP |
| `RedisCacheService.cs` | Cache dùng Redis (IConnectionMultiplexer) |
| `MemoryCacheService.cs` | Fallback cache dùng IMemoryCache |
| `VnPayGateway.cs` | Tạo URL thanh toán VNPay sandbox |
| `MoMoGateway.cs` | Tạo URL thanh toán MoMo sandbox |
| `SignalRNotificationHub.cs` | Gửi event tới client qua SignalR |

#### Background Jobs

| Job | Schedule | Mô tả |
|---|---|---|
| `BookingExpiryJob` | Mỗi phút | Hủy booking `Pending` quá 15 phút chưa thanh toán, gửi thông báo tới user |
| `BookingReminderJob` | Mỗi 30 phút | Gửi nhắc nhở cho booking bắt đầu trong ~1 giờ |

`HangfireJobScheduler.Schedule()` được gọi 1 lần trong `Program.cs` sau khi build app.

#### Migrations

Nằm trong `SportSG.Infrastructure/Migrations/`. Chạy auto-migrate khi `IsDevelopment()`.

---

### 3.5 API Layer

**`SportSG.API`** — Entry point, controllers, middleware.

#### Controllers

| Controller | Route | Vai trò được phép |
|---|---|---|
| `AuthController` | `api/auth` | Public (register/login/google); Authorized (logout/change-password) |
| `UserController` | `api/users` | SuperAdmin, PartnerAdmin, BranchManager, Customer (chính mình) |
| `PartnerController` | `api/partners` | SuperAdmin (CRUD), PartnerAdmin (xem/update partner mình) |
| `BranchController` | `api/branches` | SuperAdmin, PartnerAdmin, BranchManager; Public (GET) |
| `CourtController` | `api/courts` | SuperAdmin, PartnerAdmin, BranchManager; Public (GET) |
| `BookingController` | `api/bookings` | Customer (tạo), Staff/Manager (walk-in, confirm/checkin/checkout); Public (availability) |
| `PaymentController` | `api/payments` | Authorized users + VNPay/MoMo webhook (anonymous nhưng có HMAC) |
| `ReviewController` | `api/reviews` | Customer (sau booking hoàn thành) |
| `FavoriteController` | `api/favorites` | Customer |
| `PromotionController` | `api/promotions` | SuperAdmin, PartnerAdmin; Public (validate code) |
| `NotificationController` | `api/notifications` | Customer/Staff (thông báo của mình) |
| `DashboardController` | `api/dashboard` | SuperAdmin, PartnerAdmin, BranchManager, Staff (scope theo role) |
| `UploadController` | `api/upload` | Authorized (upload ảnh sân/chi nhánh/avatar) |

#### Các Endpoints Quan Trọng

**Auth:**
```
POST   api/auth/register              — Đăng ký email/password
POST   api/auth/login                 — Đăng nhập, trả AccessToken + RefreshToken
POST   api/auth/google                — Đăng nhập Google (Frontend gửi id_token)
GET    api/auth/google/redirect       — Server-side Google OAuth Bước 1
GET    api/auth/google/callback       — Server-side Google OAuth Bước 2 (callback)
POST   api/auth/refresh               — Làm mới AccessToken
POST   api/auth/logout                — Thu hồi RefreshToken [Authorize]
POST   api/auth/change-password       — Đổi mật khẩu [Authorize]
POST   api/auth/forgot-password       — Gửi email reset password
POST   api/auth/reset-password        — Đặt lại mật khẩu mới
```

**Booking:**
```
POST   api/bookings                   — Khách hàng tự đặt [Customer]
POST   api/bookings/walk-in           — Nhân viên đặt hộ [Staff/Manager]
GET    api/bookings/{id}              — Chi tiết booking (scope theo role)
GET    api/bookings                   — Danh sách booking có phân trang (scope theo role)
PATCH  api/bookings/{id}/status       — Cập nhật trạng thái (Confirm/CheckIn/CheckOut/Cancel)
GET    api/bookings/availability      — Các slot còn trống của sân tại ngày [Anonymous]
```

**Partner:**
```
GET    api/partners                   — Tất cả partners [SuperAdmin]
POST   api/partners                   — Tạo partner [SuperAdmin]
POST   api/partners/register          — Partner tự đăng ký [Anonymous]
GET    api/partners/{id}              — Chi tiết partner
PATCH  api/partners/{id}/status       — Duyệt/từ chối partner [SuperAdmin]
PUT    api/partners/{id}              — Cập nhật thông tin partner
GET    api/partners/{id}/members      — Danh sách thành viên
POST   api/partners/{id}/members      — Gán user vào partner [SuperAdmin]
DELETE api/partners/{id}/members/{assignmentId}  — Xóa vai trò (soft-delete)
```

**Dashboard:**
```
GET    api/dashboard          — Tổng quan theo role (SuperAdmin/PartnerAdmin/BranchManager/Staff)
GET    api/dashboard/revenue  — Báo cáo doanh thu [SuperAdmin, PartnerAdmin]
```

---

### 3.6 Middleware Pipeline

Thứ tự middleware trong `Program.cs` (quan trọng — không đảo thứ tự):

```
1. ExceptionHandling       — bắt mọi exception, trả JSON chuẩn
2. SerilogRequestLogging   — log mỗi request (kèm UserId, PartnerId, IP)
3. Swagger (dev only)
4. HangfireDashboard (dev only, tại /jobs)
5. HttpsRedirection
6. Private Network CORS header
7. CORS ("Frontend")
8. RateLimiter             — giới hạn request
9. Authentication          — validate JWT
10. TenantMiddleware       — đọc partnerId/branchId từ JWT claims → HttpContext.Items
11. AuditLogging           — ghi AuditLog cho mutating requests (POST/PUT/PATCH/DELETE)
12. Authorization
13. MapControllers
14. MapHub /hubs/notifications
```

#### Rate Limits

| Policy | Limit |
|---|---|
| `PublicApi` | 100 requests/phút, queue 10 |
| `AuthApi` | 10 requests/phút (chống brute force) |

#### TenantMiddleware

Sau khi xác thực JWT, middleware đọc claims `partnerId`, `branchId`, và `sub` (userId) rồi đặt vào `HttpContext.Items`. Controllers truy cập qua `HttpContext.GetUserId()`, `HttpContext.GetPartnerId()`, `HttpContext.GetRole()`.

---

### 3.7 Xác Thực & Phân Quyền

#### JWT

- **Algorithm:** HS256 (HMAC SHA-256)
- **Claims tiêu chuẩn:** `sub` (userId), `role`, `email`
- **Claims tùy chỉnh:** `partnerId`, `branchId`
- **Expiry:** Cấu hình `Jwt:ExpireHours` (mặc định 8 giờ)
- **ClockSkew:** `TimeSpan.Zero` (không cho phép lệch giờ)
- **Refresh Token:** Lưu trong bảng `RefreshTokens`, hỗ trợ xoay vòng

#### Google OAuth — 2 luồng

**Luồng 1 (Frontend-driven):**
```
1. Frontend tích hợp Google Identity Services / One Tap
2. Nhận id_token từ Google
3. POST /api/auth/google { idToken: "..." }
4. Backend validate id_token → trả AccessToken hệ thống
```

**Luồng 2 (Server-side redirect):**
```
1. Browser → GET /api/auth/google/redirect → Redirect sang Google
2. Google → GET /api/auth/google?code=...  (callback)
3. Dev: trả JSON; Production: redirect về frontend/auth/callback?accessToken=...
```

#### Phân Quyền Multi-tenant

- `[Authorize(Roles = Roles.SuperAdmin)]` — chỉ SuperAdmin
- `[Authorize(Roles = $"{Roles.Staff},{Roles.BranchManager}")]` — Staff hoặc BranchManager
- `TenantGuard.RequirePartnerAccessAsync()` — kiểm tra PartnerAdmin chỉ truy cập partner của mình

---

### 3.8 Background Jobs (Hangfire)

Dashboard: `https://localhost:62116/jobs` (chỉ Dev)

**Booking Expiry Job** (queue: `critical`, mỗi phút):
- Tìm tất cả booking `Pending` tạo quá 15 phút
- Cập nhật status → `Cancelled`
- Gửi SignalR event `booking.expired` tới customer
- Retry 3 lần tự động

**Booking Reminder Job** (queue: `default`, mỗi 30 phút):
- Tìm booking sắp bắt đầu trong ~1 giờ
- Gửi email/notification nhắc nhở

**Queues:** `critical` > `default` > `low`  
**Workers:** `max(2, ProcessorCount)`

---

### 3.9 Real-time (SignalR)

Hub endpoint: `/hubs/notifications`

JWT cho SignalR: truyền qua query string `?access_token=<token>` khi kết nối (không qua header).

Sự kiện gửi từ server:
- `booking.expired` — booking bị hủy do timeout thanh toán
- `booking.confirmed` — booking được xác nhận
- `notification` — thông báo chung

---

### 3.10 Cấu Hình & Biến Môi Trường

File: `SportSG.API/appsettings.json`

```json
{
  "ConnectionStrings": {
    "Default": "Server=localhost;uid=sa;pwd=...;database=SportSGDb;TrustServerCertificate=True;",
    "Redis": ""         // để trống = fallback MemoryCache
  },
  "Jwt": {
    "Key":         "min-32-chars-secret",
    "Issuer":      "SportSG",
    "Audience":    "SportSG-Clients",
    "ExpireHours": "8"
  },
  "Email": {
    "Host":     "smtp.gmail.com",
    "Port":     "587",
    "Username": "",
    "Password": ""
  },
  "Cloudinary": { "CloudName": "", "ApiKey": "", "ApiSecret": "" },
  "VnPay":      { "TmnCode": "", "HashSecret": "", "BaseUrl": "...", "Version": "2.1.0" },
  "MoMo":       { "PartnerCode": "", "AccessKey": "", "SecretKey": "", "Endpoint": "..." },
  "Google":     { "ClientId": "...", "ClientSecret": "", "RedirectUri": "...", "FrontendUrl": "http://localhost:3000" }
}
```

> **Bảo mật:** `appsettings.Development.json.example` là template — sao chép thành `appsettings.Development.json` (gitignored) và điền credentials thật. Không commit secrets vào repo.

---

## 4. Frontend: React Web App

### Công Nghệ

- **React 18** với Create React App (`react-scripts`)
- **Routing:** `react-router-dom`
- **UI:** MUI (Material UI), Ant Design, NextUI
- **Charts:** Nivo, FullCalendar
- **Auth:** Firebase/Google Sign-in helpers
- **Sidebar:** `react-pro-sidebar`
- **Notifications:** `react-toastify`

### Scripts

```bash
npm start        # Dev server http://localhost:3000
npm run build    # Production build → /build
npm test         # Jest tests
npm run dev      # CRA + json-server mock (port 5266)
```

### Cấu Trúc

```
src/
├── index.js                    # React entry point
├── App.js                      # Route table (public + admin + staff)
├── theme.js                    # MUI theme / color mode
├── firebase.js                 # Firebase / Google OAuth config
├── Components/
│   ├── fetchWithAuth/
│   │   └── fetchWithAuth.jsx   # Wrapper fetch + Bearer token + redirect /signin khi 401
│   ├── AdminLayout.jsx         # Shell layout admin/staff (sidebar + topbar)
│   └── googleSignin/           # Google Sign-in button component
└── Scene/
    ├── global/
    │   ├── Sidebar.jsx          # Navigation admin/staff (role-aware từ JWT)
    │   └── Topbar.jsx
    └── [feature]/               # Màn hình theo tính năng
```

### Bảng Route (App.js)

**Customer/Public:**
```
/                  — Landing / Home redirect
/home              — Trang chủ
/signin            — Đăng nhập
/signup            — Đăng ký
/viewCourtInfo     — Thông tin sân
/findCourt         — Tìm kiếm sân
/bookCourt         — Đặt sân
/buyTime           — Nạp tiền ví
/paySuccess        — Thanh toán thành công
/payFail           — Thanh toán thất bại
/bookingHistory    — Lịch sử đặt sân
/paymentHistory    — Lịch sử thanh toán
/googleMap         — Bản đồ chi nhánh
/contacts          — Liên hệ
/editInfo          — Chỉnh sửa hồ sơ
/viewInfo          — Xem hồ sơ
/ResetPassword     — Đặt lại mật khẩu
/verifyAccount     — Xác thực tài khoản
/createFeedbackModal — Gửi phản hồi
```

**Admin:**
```
/admin/dashboard   /admin/user      /admin/branch
/admin/court       /admin/discount  /admin/timeSlot
/admin/timeManage  /admin/payment   /admin/feedback
/admin/bar         /admin/line      /admin/pie
```

**Staff:**
```
/staff/dashboard   /staff/user      /staff/court
/staff/timeSlot    /staff/payment   /staff/staffFeedback
/staff/bar         /staff/line      /staff/pie
```

### Token Storage (Không Nhất Quán)

> **Cần chú ý:** Có sự không nhất quán trong code frontend:
> - `fetchWithAuth.jsx` đọc token từ `sessionStorage.token`
> - `Sidebar.jsx` đọc claims từ `sessionStorage`
> - `App.js` kiểm tra expiry từ `localStorage`
>
> Trước khi thay đổi logic auth frontend, đọc kỹ cả 3 file trên.

### API Base URL Frontend

Hầu hết các component gọi API tới `https://localhost:7233` (URL từ backend cũ). Sau khi migration sang SportSG API, cần cập nhật thành URL của SportSG API.

---

## 5. Mobile: Flutter App

### Công Nghệ

- **Flutter / Dart** — Multi-platform (chủ yếu Android/iOS)
- **State management:** Provider (SessionController)
- **HTTP client:** Dio với Bearer auth interceptor
- **Secure storage:** `flutter_secure_storage` (lưu JWT)
- **Navigation:** push-based routing

### Cấu Trúc

```
mobile_flutter/lib/
├── main.dart                     # Entry point, SessionProvider
├── core/
│   ├── config/
│   │   └── api_config.dart       # API base URL
│   ├── network/
│   │   ├── api_client.dart       # Dio client, Bearer auth, SSL override (dev)
│   │   └── customer_api.dart     # Service layer: tất cả API calls
│   └── session/
│       └── session_controller.dart  # Login/register/restore/logout + lưu token
├── features/
│   ├── auth/                     # Màn hình login / register
│   ├── home/                     # Trang chủ, tìm kiếm chi nhánh
│   ├── courts/                   # Duyệt sân theo chi nhánh
│   ├── booking/                  # Đặt sân, chọn giờ
│   ├── history/                  # Lịch sử đặt sân + lịch sử thanh toán
│   ├── profile/                  # Thông tin cá nhân
│   └── feedback/                 # Xem và gửi phản hồi
└── shared/                       # Widgets dùng chung
```

### API Base URL Mobile

```dart
// android emulator: 10.0.2.2 = localhost của máy host
const apiBaseUrl = "https://10.0.2.2:62116";

// Thiết bị vật lý: chạy với flag
// flutter run --dart-define=API_BASE_URL=https://192.168.x.x:62116
```

> SSL certificate override được bật trong dev mode — `api_client.dart` bỏ qua certificate validation khi kết nối localhost.

### Tính Năng Mobile (Phase 1)

- Đăng nhập / đăng ký (email + password)
- Duyệt chi nhánh và sân
- Đặt sân bằng số dư ví (`Slot/BookingByBalance`)
- Lịch sử đặt sân và thanh toán
- Hồ sơ cá nhân
- Danh sách và gửi phản hồi cho chi nhánh
- Nạp tiền ví: tạo URL thanh toán → mở browser bên ngoài → user quay lại app và refresh

---

## 6. Database Schema

**Database:** `SportSGDb` trên SQL Server

### Bảng Chính

```
Users               — Tài khoản: email (unique), password hash, Google OAuth, avatar, balance, loyalty points
Partners            — Đối tác: tên, tax code, commission rate, status (Pending/Active/Suspended/Rejected)
PartnerUserRoles    — Giao vai trò: (UserId, PartnerId, BranchId, RoleId) unique index
Branches            — Chi nhánh: tọa độ GPS, giờ hoạt động, sport types
Courts              — Sân: BasePrice, CourtType, SportType, Status
CourtPricingRules   — Giá theo giờ/ngày trong tuần per sân
CourtImages         — Ảnh sân (Cloudinary URL)
CourtFacilities     — Tiện ích của sân
Bookings            — Đặt sân: ngày, giờ, BaseAmount/DiscountAmount/TotalAmount, Status
Payments            — Giao dịch: Method (MoMo/VNPay/Cash/Wallet), Status, TransactionRef
CommissionLedger    — Hạch toán hoa hồng: GrossAmount, CommissionRate, NetAmount per payment
Reviews             — Đánh giá sân sau đặt (per booking)
Promotions          — Mã giảm giá: Percent/Fixed, ValidFrom/To, UsageLimit
Memberships         — Gói hội viên per partner
UserMemberships     — User đăng ký gói hội viên
LoyaltyTransactions — Lịch sử tích/dùng điểm thưởng
Notifications       — Thông báo in-app per user
Schedules           — Lịch weekly của branch
Holidays            — Ngày nghỉ đặc biệt
MaintenanceSchedules — Lịch bảo trì sân
AuditLogs           — Log mọi thao tác mutating (auto ghi bởi middleware)
PaymentLogs         — Log raw response từ payment gateway
RefreshTokens       — JWT refresh tokens
Roles               — Định nghĩa vai trò (SuperAdmin, PartnerAdmin, BranchManager, Staff, Customer)
Permissions         — Fine-grained permissions
RolePermissions     — Gán permission cho role
SportTypes          — Loại môn thể thao (cầu lông, tennis, bóng đá...)
CourtTypes          — Loại sân (sân cứng, sân đất, sân cỏ...)
Favorites           — Sân/chi nhánh yêu thích của user
Banners             — Banner quảng cáo
Coupons             — Coupon một lần dùng
BranchSportTypes    — Môn thể thao per chi nhánh (many-to-many)
```

### Khởi Tạo Database

**Development (auto):** Khi chạy với environment `Development`, app tự động:
1. `db.Database.MigrateAsync()` — apply migrations còn pending
2. `DataSeeder.SeedAsync(db)` — seed roles, sport types, SuperAdmin mẫu

**Migrations:** Nằm trong `SportSG.Infrastructure/Migrations/`. Thêm migration:
```bash
cd BadmintonCourt_Booking
dotnet ef migrations add <TenMigration> --project SportSG.Infrastructure --startup-project SportSG.API
dotnet ef database update --project SportSG.Infrastructure --startup-project SportSG.API
```

**Schema SQL tham khảo:** `SportSG.Domain/schema.sql`

---

## 7. Luồng Nghiệp Vụ Chính

### 7.1 Đăng Ký & Xác Thực

```
1. POST /api/auth/register { email, password, firstName, lastName }
   → Tạo User IsActive=false, gửi email xác thực
2. User click link email → GET /api/auth/verify?token=...
   → Kích hoạt account, redirect về /signin
3. POST /api/auth/login { email, password }
   → Trả { accessToken, refreshToken, expiresAt, user: {...} }
4. Mỗi request: gửi header  Authorization: Bearer <accessToken>
5. Khi token hết hạn:
   POST /api/auth/refresh { refreshToken }
   → Trả access + refresh token mới (xoay vòng)
```

### 7.2 Partner Onboarding

```
1. POST /api/partners/register (public)
   → Tạo Partner status=Pending
2. SuperAdmin xem danh sách: GET /api/partners?status=Pending
3. SuperAdmin duyệt: PATCH /api/partners/{id}/status { status: "Active" }
4. SuperAdmin tạo tài khoản và gán vai trò:
   POST /api/partners/{id}/members { userId, roleCode: "PartnerAdmin" }
5. PartnerAdmin tạo Branch:
   POST /api/branches { name, address, city, openTime, closeTime, ... }
6. PartnerAdmin hoặc BranchManager tạo Court:
   POST /api/courts { branchId, sportTypeId, name, basePrice, pricingRules: [...] }
```

### 7.3 Đặt Sân (Customer)

```
1. Tìm kiếm: GET /api/branches?city=HCM&sportTypeId=1
2. Xem sân: GET /api/courts?branchId={id}
3. Kiểm tra slot: GET /api/bookings/availability?courtId={id}&date=2026-07-10
4. Đặt sân:
   POST /api/bookings {
     courtId, bookingDate, startTime, endTime,
     promotionId (optional), note (optional)
   }
   → Tạo Booking status=Pending, trả bookingId + payment URL
5. Khách hàng hoàn tất thanh toán (VNPay/MoMo)
6. Payment callback → Booking status=Confirmed, gửi email xác nhận + SignalR
7. Tự động hủy nếu 15 phút không thanh toán (BookingExpiryJob)
```

### 7.4 Walk-in Booking (Staff)

```
1. POST /api/bookings/walk-in (yêu cầu role Staff/BranchManager/PartnerAdmin)
   → Tạo Booking, ghi lại CreatedBy = staffId
   → Có thể thanh toán Cash tại chỗ
```

### 7.5 Check-in / Check-out

```
PATCH /api/bookings/{id}/status { status: "CheckedIn" }   // [Staff/BranchManager]
PATCH /api/bookings/{id}/status { status: "CheckedOut" }  // [Staff/BranchManager]
```

### 7.6 Hủy Đặt Sân

```
Customer hủy:    PATCH /api/bookings/{id}/status { status: "Cancelled", cancelReason: "..." }
                 → Hoàn tiền theo policy (ví dụ: hoàn 50% nếu hủy trước X giờ)
Staff hủy:       Tương tự nhưng được hoàn 100%
```

### 7.7 Loyalty Points

- Tự động tích điểm khi booking hoàn thành (multiplier theo Membership)
- Điểm có thể đổi thành discount khi đặt sân
- Lịch sử tích/dùng điểm trong bảng `LoyaltyTransactions`

---

## 8. Cổng Thanh Toán

### VNPay

- **Sandbox:** `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- **Flow:** Tạo URL có chữ ký HMAC → Redirect user → VNPay callback về `/api/payments/vnpay/callback`
- **Cấu hình:** `VnPay:TmnCode`, `VnPay:HashSecret`

### MoMo

- **Sandbox:** `https://test-payment.momo.vn/v2/gateway/api/create`
- **Flow:** POST tạo payment link → Redirect → MoMo callback về `/api/payments/momo/callback`
- **Cấu hình:** `MoMo:PartnerCode`, `MoMo:AccessKey`, `MoMo:SecretKey`

### Ví Wallet

- User nạp tiền trước qua VNPay/MoMo vào số dư `User.Balance`
- Khi đặt sân chọn phương thức `Wallet`: trừ thẳng số dư, không cần redirect
- `BookingByBalance` (endpoint cũ) hoặc `PaymentMethod.Wallet` trong request mới

### Commission

Mỗi Payment thành công tạo một bản ghi `CommissionLedger`:
- `GrossAmount` — tổng tiền khách trả
- `CommissionRate` — % hoa hồng của Partner (mặc định 10%)
- `CommissionAmt` = GrossAmount × CommissionRate
- `NetAmount` = GrossAmount − CommissionAmt (Partner nhận)

---

## 9. Hạ Tầng & Triển Khai

### Docker

```yaml
# docker-compose.yml tại gốc repo
services:
  api:          # SportSG API
  frontend:     # React app phục vụ qua Nginx
  db:           # SQL Server
```

### Nginx

- `nginx.conf` — cấu hình chính cho production
- `frontend-nginx.conf` — cấu hình riêng cho React frontend

### CI (GitHub Actions)

File: `.github/workflows/ci-script.yml`
- Trigger: push/PR vào `main`
- Steps:
  1. `dotnet restore`
  2. `dotnet build --no-restore`
  3. `dotnet test --no-build`
- Scope: `BadmintonCourt_Booking/` (solution SportSG)

### Domain Production

CORS cho phép: `https://sportsg.online`, `https://www.sportsg.online`

---

## 10. Backend Cũ (Tham Khảo)

Dự án từng có một backend với namespace `BadmintonCourt`:

```
BadmintonCourt_Booking/
├── BadmintonCourtAPI/               # ASP.NET Core API cũ
├── BadmintonCourtBusinessObjects/   # Entities + DTOs cũ
├── BadmintonCourtDAOs/              # EF DbContext + DAO cũ
├── BadmintonCourtRepositories/      # Services cũ
├── BadmintonCourtNUnitTests/        # Tests
├── RazorPage/                       # UI Razor Pages
└── ClassLibrary1,2,3/               # Code cũ/thử nghiệm
```

**Đặc điểm backend cũ (đã thay thế):**
- Connection string hard-code trong `BadmintonCourtContext.cs`
- Controllers tạo services bằng `new Service()` thay vì DI
- API URL dạng `User/LoginAuth?username=...&password=...` (query string cho POST)
- Không có multi-tenant, không có Clean Architecture

> **Không phát triển thêm vào backend cũ.** Tất cả tính năng mới phải vào `SportSG.*` projects.

---

## 11. Lưu Ý Quan Trọng Cho Developer

### Khi Làm Backend (SportSG)

1. **Luôn làm việc trong `BadmintonCourt_Booking/SportSG.*`** — không sửa `BadmintonCourt*` cũ
2. **Dependency Injection:** Đăng ký service mới trong `Program.cs`, không dùng `new Service()`
3. **Tenant scope:** Mọi query dữ liệu của PartnerAdmin/BranchManager/Staff phải lọc theo `partnerId`/`branchId` từ `HttpContext.Items`
4. **Migrations:** Sau khi thay đổi entity, tạo migration ngay. Không sửa file migration đã apply
5. **Audit:** `AuditLogging` middleware tự ghi log — không cần ghi thủ công trong controller
6. **Cache:** Dùng `ICacheService` thay vì inject trực tiếp Redis/IMemoryCache để tương thích cả hai
7. **SignalR JWT:** Token phải truyền qua query string `?access_token=` khi kết nối hub

### Khi Làm Frontend React

1. Đọc `src/App.js` trước để biết vị trí đặt route mới
2. Dùng `fetchWithAuth` cho mọi API call cần xác thực
3. Kiểm tra token storage (`sessionStorage` vs `localStorage`) trước khi sửa auth logic
4. URL API cần cập nhật từ `https://localhost:7233` (cũ) sang URL SportSG API

### Khi Làm Flutter

1. Cập nhật `api_config.dart` nếu đổi port API
2. Thiết bị thật: chạy với `--dart-define=API_BASE_URL=https://<LAN-IP>:<port>`
3. SSL override chỉ bật trong dev — production cần certificate hợp lệ

### Anti-patterns Cần Tránh

- Không commit credentials thật vào `appsettings.json`
- Không sửa `bin/obj` (build artifacts trong repo)
- Không thêm logic vào `ClassLibrary*` cũ
- Không bypass `[Authorize]` để test — dùng Swagger với Bearer token
- Không query DB trực tiếp trong controller — luôn qua `IUnitOfWork`/service
- Không hardcode `partnerId`/`branchId` trong query — lấy từ `HttpContext.GetPartnerId()`
