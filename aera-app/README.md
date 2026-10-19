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

The app uses the hosted Aera API at `aera-cloud.hacksmiths.dev` by default. This endpoint is served through the configured Cloudflare Tunnel, so the backend, its database, and the tunnel routes must be available for sign-in and cloud-backed features to work. To use a different backend, change `API_BASE_URL` and `WS_BASE_URL` in `src/services/api.js` before building. For emulators and physical devices, configure an address reachable from that device; its `localhost` does not refer to the development computer.

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

If the generated native project is not present, create it from `app.json` and the Expo config plugins:

```sh
npx expo prebuild --platform android
```

Build a signed release APK from `aera-app/android/`:

```sh
cd android
./gradlew assembleRelease \
  -Dorg.gradle.internal.http.connectionTimeout=120000 \
  -Dorg.gradle.internal.http.socketTimeout=120000
```

The APK is created at:

```sh
android/app/build/outputs/apk/release/app-release.apk
```

Release APKs use a private signing key at `~/.config/aera/android-release/aera-release.jks`; its path, alias, and passwords are configured in the user-level `~/.gradle/gradle.properties` file with the `AERA_UPLOAD_*` properties. Keep the keystore and properties file outside the repository, back them up securely, and never commit either. Gradle refuses to package a release if the signing properties or keystore are missing. Configure equivalent protected secrets on any other build machine or CI runner.

Once a production-signed APK is published, download it from the [Aera GitHub Releases](https://github.com/tushar6076/Aera/releases) page. The previously generated debug-signed APK is not a distributable release.

For Android and iPhone installation instructions, see [DEVICE-INSTALLATION.md](./DEVICE-INSTALLATION.md).

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

For physical-device iPhone build, trust, and installation steps, see the iOS sections in the [Aera project report](../_DOCS/AERA.docx).

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