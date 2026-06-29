# SportSG Mobile Flutter

Customer-facing Flutter app for the badminton court booking system.

## Phase 1 Scope

- Login and register with the existing ASP.NET Core API.
- Persist JWT with `flutter_secure_storage`.
- Browse branches and courts.
- View branch feedback and submit feedback.
- Book a court using current balance.
- View booking and payment history.
- View profile and balance.
- Start VNPay/MoMo top-up by opening the backend payment URL in the external browser.

## API Configuration

Default API base URL:

```text
https://10.0.2.2:7233
```

This works for Android emulator when the backend runs on the host machine.

For a real phone on the same Wi-Fi, pass your computer LAN IP:

```powershell
flutter run --dart-define=API_BASE_URL=https://192.168.1.10:7233
```

The dev API client accepts local self-signed HTTPS certificates for:

- `10.0.2.2`
- `localhost`
- `127.0.0.1`
- `192.168.*`

Do not keep that behavior for production builds.

## Run

Start the backend first:

```powershell
cd ..\BadmintonCourt_Booking\BadmintonCourtAPI
dotnet run --launch-profile https
```

Then run the mobile app:

```powershell
cd ..\..\mobile_flutter
flutter run
```

## Payment Note

The current backend redirects VNPay/MoMo callbacks to the React web success page. Phase 1 opens payment in the external browser, then the user returns to the app and refreshes profile/history.

For a production mobile flow, add backend-supported deep links such as:

```text
sportsg://paySuccess?msg=Success
```

