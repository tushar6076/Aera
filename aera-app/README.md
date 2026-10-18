# Aera Mobile App

`aera-app` is Aera's native mobile client for **Android and iOS**. Built with Expo and React Native, it lets users sign in, view air-quality readings, manage sensor devices, review history, and access Aera's AI chat.

## Features

- Registration, sign-in, password reset, and persisted authentication.
- Dashboard for selecting devices and viewing current air-quality readings.
- Telemetry history, device claiming, and account/device settings.
- AI chat and recommendations through the Aera Cloud API.
- REST requests and live telemetry over WebSockets.

## Technology

- Expo SDK 57, React Native 0.86, React 19
- React Navigation native stack
- Axios for API requests
- AsyncStorage for persisted session tokens
- Jest and React Native Testing Library for automated component/unit tests

## Requirements

- Node.js and npm versions supported by the installed Expo SDK
- **Android:** Android Studio, Android SDK, Java/Gradle toolchain, and an emulator or USB-connected device
- **iOS:** macOS with Xcode, CocoaPods, and an iOS Simulator or connected device
- Aera Cloud API access for authenticated features

## Install dependencies

From the `aera-app/` directory:

```sh
npm ci
npm test
```

Automated tests are kept separately from application code in the top-level `tests/` folder. Use `npm run test:watch` while developing tests. The current starter suite verifies AQI category boundaries and loading-state rendering; it does not yet cover API integration or complete app flows. No shared Jest setup file is needed for these tests. Hardware, API integration, simulator and device flows require separate runtime checks.

The app uses the hosted Aera API by default. To use a different backend, change `API_BASE_URL` and `WS_BASE_URL` in `src/services/api.js`. For emulators and physical devices, configure an address reachable from that device; its `localhost` does not refer to the development computer.

## App icon and splash screen

`app.json` selects the shared application icon and configures the Android adaptive-icon foreground. The `expo-splash-screen` config plugin supplies the splash artwork and background for generated native projects. Keep the source assets under `assets/icons/`; regenerate native projects after changing plugin-managed artwork:

```sh
npx expo prebuild --clean
```

This command removes and regenerates native project directories. Back up any native-only changes first, or encode them in Expo config/plugins so they can be regenerated.

## Regenerate native projects

The `android/` and `ios/` directories are native projects generated from the Expo app configuration. To discard and regenerate both native projects from `app.json` and the configured Expo plugins, run this from `aera-app/`:

```sh
npx expo prebuild --clean
```

This removes the existing native project directories before recreating them. Any native-only edits that are not represented in the Expo configuration or plugins will be lost, so review or back up such changes first. Reinstall iOS pods after regenerating if needed:

```sh
cd ios
pod install
```

## Android

Build a clean release APK from the Android project:

```sh
cd android
./gradlew clean
./gradlew assembleRelease \
  -Dorg.gradle.internal.http.connectionTimeout=120000 \
  -Dorg.gradle.internal.http.socketTimeout=120000
```

The APK is created at:

```sh
android/app/build/outputs/apk/release/app-release.apk
```

From the `aera-app/` directory, install the APK on a running emulator or USB-connected device and launch the app:

```sh
"$ANDROID_HOME/platform-tools/adb" install -r android/app/build/outputs/apk/release/app-release.apk
"$ANDROID_HOME/platform-tools/adb" shell monkey \
  -p dev.hacksmiths.aera \
  -c android.intent.category.LAUNCHER 1
```

`ANDROID_HOME` must point to the Android SDK installation. If `adb` is already on your `PATH`, you can use `adb` instead of its full SDK path.

The current Gradle configuration signs release APKs with the default debug keystore. This is suitable for local testing only; configure a private release signing key before distributing a production build. Never commit signing credentials.

## iOS

The native iOS project uses CocoaPods and an Xcode workspace. If pods are missing or native dependencies have changed, install them first:

```sh
cd ios
pod install
```

Open the workspace (not the `.xcodeproj`) to build, run, or archive with Xcode:

```sh
open Aera.xcworkspace
```

To build and launch on an available iOS Simulator from `aera-app/`:

```sh
npx react-native run-ios
```

To choose a particular installed simulator, pass its name:

```sh
npx react-native run-ios --simulator="<simulator-name>"
```

Use Xcode's signing settings and Archive workflow for device or App Store distribution. Device builds require valid Apple signing credentials.

## Project structure

```text
aera-app/
├── App.jsx                # Providers, startup splash, and navigator
├── app.json               # Expo app identity and native platform settings
├── tests/                 # Automated unit and component tests
└── src/
    ├── components/        # Shared, dashboard, layout, and UI components
    ├── hooks/             # Auth, device, AQI, and chat state
    ├── navigation/        # Authenticated and signed-out navigation stacks
    ├── screens/           # Dashboard, history, settings, chat, and auth screens
    └── services/          # API, auth, device, monitoring, and AI clients
```

See the [project README](../README.md) for backend and full-stack setup.