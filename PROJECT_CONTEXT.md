# Project Context for Future Codex Sessions

Last reviewed: 2026-06-10

This file is a compact map of the repository so future AI/Codex sessions can avoid rescanning the whole project.

## High-Level Summary

This repository is a badminton court booking system with:

- React frontend at the repository root under `src/`.
- Main ASP.NET Core 8 backend/API under `BadmintonCourt_Booking/`.
- Flutter customer mobile app under `mobile_flutter/`.
- SQL Server database scripts at root: `BadmintonCourt.sql`, `demoScript.sql`, `official.sql`.
- Extra/experimental backend material under `src/BE/` including a Blazor sample and another DAO/Repository/Services structure.
- A small JSON mock server config in `server/db.json`, started by `npm run dev`, but most frontend code calls the real ASP.NET API at `https://localhost:7233`.

Primary product areas:

- Public customer site: browse branches/courts, map, search, book courts, buy balance, view history, feedback.
- Authentication: username/password, Google external auth, email verification, password reset.
- Admin/staff portal: dashboard, users, branches, courts, discounts, timeslots, payments, feedback, charts.
- Payments: VNPay and MoMo sandbox integrations.

## Root Layout

- `package.json`: Create React App frontend scripts and dependencies.
- `src/`: React app source.
- `public/`: CRA public assets.
- `server/db.json`: JSON-server mock database.
- `BadmintonCourt_Booking/`: main .NET 8 solution.
- `mobile_flutter/`: Flutter mobile app for customer Phase 1.
- `src/BE/`: secondary .NET/Blazor code, likely older or experimental.
- `.github/workflows/ci-script.yml`: CI restores/builds/tests `BadmintonCourt_Booking`.
- `BadmintonCourt.sql`, `demoScript.sql`, `official.sql`: database setup/demo scripts.
- `API`: tiny placeholder file, not useful documentation.

## Frontend

Framework and libraries:

- React 18 with Create React App (`react-scripts`).
- Routing via `react-router-dom`.
- UI/chart dependencies include MUI, Ant Design, NextUI, FullCalendar, Nivo, react-pro-sidebar, react-toastify.
- Firebase/Google sign-in helpers exist in `src/firebase.js` and `src/Components/googleSignin/`.

Scripts:

- `npm start`: starts CRA on `http://localhost:3000`.
- `npm run build`: production build.
- `npm test`: CRA/Jest tests.
- `npm run dev`: runs CRA plus `json-server --watch server/db.json --port=5266`.

Important frontend files:

- `src/index.js`: React entrypoint.
- `src/App.js`: route table for public, admin, and staff pages.
- `src/theme.js`: MUI theme/color mode helpers.
- `src/Components/fetchWithAuth/fetchWithAuth.jsx`: wrapper that reads `sessionStorage.token`, attaches `Authorization: Bearer ...`, and redirects to `/signin` on missing/401 token.
- `src/Components/AdminLayout.jsx`: admin/staff shell with sidebar/topbar.
- `src/Scene/global/Sidebar.jsx`: role-aware admin/staff navigation based on JWT claims.

Frontend token storage caveat:

- `fetchWithAuth` and admin sidebar use `sessionStorage`.
- `src/App.js` checks token expiration from `localStorage`.
- Login/register flows should be checked before changing auth behavior because token storage is inconsistent.

Main routes from `src/App.js`:

- Public/customer: `/`, `/home`, `/signin`, `/signup`, `/viewCourtInfo`, `/viewInfo`, `/editInfo`, `/findCourt`, `/ResetPassword`, `/verifyAccount`, `/bookCourt`, `/buyTime`, `/paySuccess`, `/payFail`, `/bookingHistory`, `/paymentHistory`, `/googleMap`, `/contacts`, `/createFeedbackModal`.
- Admin: `/admin/dashboard`, `/admin/user`, `/admin/branch`, `/admin/court`, `/admin/discount`, `/admin/timeSlot`, `/admin/timeManage`, `/admin/payment`, `/admin/bar`, `/admin/line`, `/admin/feedback`, `/admin/pie`.
- Staff: `/staff/dashboard`, `/staff/user`, `/staff/court`, `/staff/timeSlot`, `/staff/payment`, `/staff/bar`, `/staff/line`, `/staff/staffFeedback`, `/staff/pie`.

Frontend API base:

- Most real calls are hard-coded to `https://localhost:7233`.
- Some backend config still references `http://localhost:5266` as issuer/audience/return URL.
- `5266` is also used by `json-server` in `npm run dev`, so be careful not to confuse the mock server with the .NET API HTTP profile.

## Main Backend: `BadmintonCourt_Booking`

Solution:

- `BadmintonCourt_Booking/BadmintonCourt_Booking.sln`
- Target framework: .NET 8.

Projects:

- `BadmintonCourtAPI/`: ASP.NET Core Web API and Razor Pages endpoint host.
- `BadmintonCourtBusinessObjects/`: EF entities plus DTO/support/external payment models.
- `BadmintonCourtDAOs/`: EF Core DbContext and DAO classes.
- `BadmintonCourtRepositories/`: service layer, despite project name `BadmintonCourtServices.csproj`.
- `BadmintonCourtNUnitTests/`: NUnit tests for controllers and DAOs.
- `BenchmarkSuite1/`: BenchmarkDotNet-style benchmark project.
- `RazorPage/`: Razor Pages UI sample/older UI.
- `ClassLibrary1`, `ClassLibrary2`, `ClassLibrary3`: duplicated/older class library content; not the main app path.

Run/build:

- From `BadmintonCourt_Booking`: `dotnet restore`, `dotnet build`, `dotnet test`.
- API launch settings expose `https://localhost:7233;http://localhost:5266`.
- Swagger is enabled in Development.

CI:

- `.github/workflows/ci-script.yml` runs on push/PR to `main`.
- It runs `dotnet restore`, `dotnet build --no-restore`, `dotnet test --no-build` in `BadmintonCourt_Booking`.

## Mobile App: `mobile_flutter`

Flutter customer-facing app created for Phase 1.

Implemented scope:

- Login/register using existing `User/LoginAuth` and `User/Register`.
- JWT persistence via `flutter_secure_storage`.
- Branch/court browsing.
- Booking by balance via `Slot/BookingByBalance`.
- Booking/payment history via `Booking/GetByUser` and `Payment/GetByUser`.
- Profile lookup via `User/GetById` and `UserDetail/GetById`.
- Feedback list/post for branches.
- Buy balance by creating payment URL with `Booking/TransactionProcess` and opening it in the external browser.

Important files:

- `mobile_flutter/lib/main.dart`: app entry and session provider.
- `mobile_flutter/lib/core/config/api_config.dart`: API base URL.
- `mobile_flutter/lib/core/network/api_client.dart`: Dio client, bearer auth, local dev certificate override.
- `mobile_flutter/lib/core/network/customer_api.dart`: customer API service layer.
- `mobile_flutter/lib/core/session/session_controller.dart`: login/register/restore/logout.
- `mobile_flutter/lib/features/*`: screens by feature.

Default API URL:

- `https://10.0.2.2:7233` for Android emulator.
- For physical devices, run with `--dart-define=API_BASE_URL=https://<LAN-IP>:7233`.

Mobile payment caveat:

- Existing backend redirects payment callbacks to React web `/paySuccess`.
- Phase 1 opens payment externally; user returns to app and refreshes profile/history.
- Production mobile should add deep link callback support.

## Backend Configuration

Key file:

- `BadmintonCourt_Booking/BadmintonCourtAPI/appsettings.json`

Important settings:

- SQL Server connection string points to local SQL Server with database `BadmintonCourt`.
- JWT issuer/audience are configured as `http://localhost:5266/`.
- VNPay sandbox settings are present.
- MoMo test payment settings are present.
- CORS allows `http://localhost:3000`.

Security warning:

- Real-looking JWT key and payment sandbox secrets are committed in appsettings. Treat as development credentials and rotate before production.

DbContext caveat:

- `BadmintonCourt_Booking/BadmintonCourtDAOs/BadmintonCourtContext.cs` hard-codes `UseSqlServer("Server=(local);Database= BadmintonCourt;UID=sa;PWD=12345;TrustServerCertificate=True")`.
- `Program.cs` only configures `UseInMemoryDatabase` when `UseInMemoryDatabase` is true. Otherwise it does not wire the configured SQL Server connection string into DI, so many services rely on parameterless context creation/hard-coded connection behavior.

## Backend Architecture

Dependency registration happens in `BadmintonCourt_Booking/BadmintonCourtAPI/Program.cs`:

- `IRoleService -> RoleService`
- `IUserService -> UserService`
- `IUserDetailService -> UserDetailService`
- `ICourtService -> CourtService`
- `ICourtBranchService -> CourtBranchService`
- `ISlotService -> SlotService`
- `IBookingService -> BookingService`
- `IPaymentService -> PaymentService`
- `IFeedbackService -> FeedbackService`
- `IDiscountService -> DiscountService`
- `IMailService -> MailService`
- `IMoMoService -> MoMoService`
- `IVnPayService -> VnPayService`
- `ICoordinateService -> CoordinateService`

Pattern:

- Controllers live in `BadmintonCourtAPI/Controllers`.
- Services live in `BadmintonCourtRepositories`.
- DAO classes live in `BadmintonCourtDAOs`.
- Entities/DTOs live in `BadmintonCourtBusinessObjects`.

Implementation caveat:

- Several controllers instantiate services directly with `new Service()` even when DI exists. If refactoring, account for both DI and direct construction.

## Database Model

Main EF context:

- `BadmintonCourt_Booking/BadmintonCourtDAOs/BadmintonCourtContext.cs`

Main tables/entities:

- `User`: account, username/password hash, role, balance, branch assignment, active status, access-fail lock state, email/action token fields.
- `UserDetail`: profile fields, email, phone, names, image, facebook.
- `Role`: role definitions. Common IDs appear to be `R001` Admin, `R002` Staff, `R003` Customer.
- `CourtBranch`: branch name, location, phone, image, status, map URL.
- `Court`: court name/status, branch, price, image, description.
- `Booking`: booking record, user, amount, type, date, deletion flag, change log.
- `BookedSlot`: concrete booked slot with court, booking, start/end time, deletion flag.
- `Payment`: payment transaction, amount, method, booking/user, transaction ID, date.
- `Feedback`: rating/content by user for branch.
- `Discount`: payment top-up promotion thresholds/proportions.

Important sentinel:

- `SlotController` uses slot `S1` as the office-hours primitive. `UpdateOfficeHours` changes `S1.StartTime` and `S1.EndTime`.

## API Surface

Controllers and representative endpoints:

- `UserController`
  - `User/LoginAuth`
  - `User/ExternalLogAuth`
  - `User/Register`
  - `User/VerifyAction`
  - `User/VerifyBeforeReset`
  - `User/ForgotPassReset`
  - `User/GetAll`, `User/GetById`, `User/GetStaffsInBranch`, `User/GetByRole`
  - `User/Add`, `User/Update`, `User/Delete`
- `UserDetailController`
  - `UserDetail/GetAll`, `GetById`, `GetByName`, `GetBySearch`
  - `UserDetail/Register`, `Update`, `Delete`
- `RoleController`
  - `Role/GetAll`, `GetByName`, `GetById`, `Add`, `Update`, `Delete`
- `BranchController`
  - `Branch/GetAll`, `GetNearby`, `GetBySearch`
  - `Branch/Add`, `Update`, `Delete`
- `CourtController`
  - `Court/GetAll`, `GetById`, `GetByStatus`, `GetByBranch`, `GetByPrice`, `GetBySearch`
  - `Court/Add`, `Update`, `Inactivate`
- `DiscountController`
  - `Discount/GetAll`, `GetById`, `Add`, `Update`, `Recover`, `Delete`
- `FeedbackController`
  - `Feedback/GetAll`, `GetByBranch`, `GetBySearch`, `GetByUser`, `GetByRate`
  - `Feedback/Post`, `Update`, `Delete`
- `BookingController`
  - `Booking/GetAll`, `GetById`, `GetByUser`, `Bookinng/GetByType` typo in route
  - `Booking/TypeStatistic`, `Booking/Update`, `Booking/Delete`
- `SlotController`
  - `Slot/GetAll`, `GetByDemand`, `GetSlotCourtInDay`, `GetSlotCourtInInterval`, `GetBeforeConfirm`
  - `Slot/BookingByBalance`
  - `Slot/UpdateOfficeHours`, `UpdateByStaff`, `UpdateByUser`
  - `Slot/CancelByStaff`, `Cancel`
  - `Slot/SlotStatistic`, `CancelStatistic`, `CancelSlotStatisticV2`
  - `Slot/UpdateResultProcessVnPay`, `UpdateResultProcessMomo`
- `PaymentController`
  - `Payment/GetAll`, `GetByOrder`, `GetByUser`, `GetBySearch`
  - `Payment/Statistic`
  - `Booking/TransactionProcess`
  - `Payment/VnPayResult`, `Payment/MomoResult`

Authorization pattern:

- JWT Bearer authentication is configured globally.
- Many admin/staff endpoints require `[Authorize(Roles = "Admin")]` or `[Authorize(Roles = "Admin,Staff")]`.
- Some read endpoints are intentionally public, such as branches/courts/slots/feedback lists.

## Main Business Flows

Login:

- Frontend calls `User/LoginAuth?username=...&password=...`.
- Backend hashes password and returns JWT with user ID, username, role, active status.
- Failed login increments `AccessFail`; non-admin accounts can be temporarily or permanently locked.

Registration:

- Frontend calls `User/Register`.
- Backend creates inactive `R003` customer, stores verification token/action period, sends email.
- `User/VerifyAction` activates account and redirects to frontend `/signin`.

Password reset:

- `User/VerifyBeforeReset?mail=...` sends reset verification email.
- `User/VerifyAction` redirects to frontend `/ResetPassword?id=...`.
- `User/ForgotPassReset` updates hashed password.

Booking/payment:

- `Booking/TransactionProcess` validates `TransactionDTO`, calculates amount, creates VNPay/MoMo payment URL.
- Payment callback `Payment/VnPayResult` or `Payment/MomoResult` parses order info, saves payment, creates booking/slots or adds balance, applies discount, sends email, redirects to frontend `/paySuccess?msg=Success|Fail`.
- `Slot/BookingByBalance` books a slot directly using user balance.
- `Slot/UpdateByUser` allows limited user slot changes within one hour and up to two changes; may use balance or generate additional payment URL.
- `Slot/Cancel` lets user cancel under similar time/change restrictions and refunds half to balance.
- `Slot/CancelByStaff` refunds full slot amount.

Dashboard/statistics:

- Payment statistics: `Payment/Statistic`.
- Booking type statistics: `Booking/TypeStatistic`.
- Slot usage/cancel stats: `Slot/SlotStatistic`, `Slot/CancelStatistic`, `Slot/CancelSlotStatisticV2`.

## Extra `src/BE` Area

`src/BE` contains a separate .NET solution (`SWP391.sln`) with:

- `BlazorApp1`
- `BusinessObj`
- `DAO`
- `Repository`
- `Services`

This appears secondary/experimental compared with `BadmintonCourt_Booking`, because the frontend calls the `BadmintonCourt_Booking` API shape and CI builds `BadmintonCourt_Booking`.

## Known Pitfalls for Future Agents

- Do not assume `server/db.json` is the main backend. It is only a mock JSON server.
- API URLs are hard-coded throughout React components, mostly `https://localhost:7233`.
- JWT token storage is inconsistent: some code uses `sessionStorage`, some checks `localStorage`.
- Many API calls pass data through query strings, including POST/PUT actions.
- Route typo exists: `Bookinng/GetByType`.
- `UserController.GetByRole` has two separate `[Authorize]` attributes for Admin and Staff, which may behave as AND rather than intended OR.
- EF connection is hard-coded in `BadmintonCourtContext`; appsettings connection string may not actually drive the DbContext.
- `BadmintonCourt_Booking` contains generated `bin/obj` files in the repo. Avoid editing build artifacts.
- There are duplicated/older class libraries under `BadmintonCourt_Booking/ClassLibrary*` and another backend under `src/BE`; verify which path is active before changing backend logic.
- Payment/email settings are committed and should be treated as dev-only.

## Suggested First Checks for Future Work

For frontend changes:

1. Read `src/App.js` for route placement.
2. Read the target component under `src/Components` or `src/Scene`.
3. Check whether it uses raw `fetch`, `axios`, or `fetchWithAuth`.
4. Verify hard-coded API endpoint and token storage assumptions.

For backend API changes:

1. Work in `BadmintonCourt_Booking`.
2. Read the relevant controller in `BadmintonCourtAPI/Controllers`.
3. Follow calls into `BadmintonCourtRepositories/*Service.cs`.
4. Follow persistence into `BadmintonCourtDAOs/*DAO.cs` and entity definitions.
5. Run `dotnet test` from `BadmintonCourt_Booking` if feasible.

For database changes:

1. Inspect `BadmintonCourt_Booking/BadmintonCourtDAOs/BadmintonCourtContext.cs`.
2. Inspect entities in `BadmintonCourt_Booking/BadmintonCourtBusinessObjects/Entities`.
3. Compare with SQL scripts at the repository root.
