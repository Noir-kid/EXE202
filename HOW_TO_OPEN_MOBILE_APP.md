# How to Open the Flutter Mobile App

## 1. Open in Android Studio

Open Android Studio, then choose:

```text
File > Open
```

Select this folder:

```text
D:\GitHub\EXE201\mobile_flutter
```

Do not open `D:\GitHub\EXE201` if you only want to run the Flutter app.

If Android Studio asks to run `Pub get`, accept it.

## 2. Start Android Emulator

In Android Studio:

```text
Tools > Device Manager
```

Start an existing emulator, or create a new Android virtual device.

## 3. Start Backend API

Open a terminal:

```powershell
cd D:\GitHub\EXE201\BadmintonCourt_Booking\BadmintonCourtAPI
dotnet run --launch-profile https
```

The backend should run at:

```text
https://localhost:7233
```

The Flutter app calls this from Android Emulator through:

```text
https://10.0.2.2:7233
```

This is already configured in:

```text
mobile_flutter/lib/core/config/api_config.dart
```

## 4. Run Flutter App

In Android Studio, select the emulator/device, then press the green Run button.

Or run from terminal:

```powershell
cd D:\GitHub\EXE201\mobile_flutter
flutter run
```

## Run on a Real Android Phone

If using a physical phone, replace `10.0.2.2` with your computer's Wi-Fi/LAN IP.

Example:

```powershell
flutter run --dart-define=API_BASE_URL=https://192.168.1.10:7233
```

Replace `192.168.1.10` with your actual computer IP.

## Notes

- You can open the mobile UI without the backend, but login/data loading will fail.
- Payment currently opens VNPay/MoMo in an external browser.
- After payment, return to the app and refresh profile/history.

