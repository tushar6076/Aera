# Installing Aera on Android and iPhone

This guide covers installing Aera on a physical Android phone or iPhone. The screenshot spaces below are placeholders; replace each one with the matching platform screenshot when it is available. Hide personal details, account identifiers, device identifiers, and notifications before adding screenshots.

## Backend availability

Installing the app does not start its backend. The mobile client is currently configured to use the hosted Aera API at `aera-cloud.hacksmiths.dev`, which must be reachable over HTTPS and WSS. Keep the backend and its required database running, and keep the Cloudflare Tunnel active with routes for the API hostname. Cloudflare Tunnel provides public network access to the backend; it does not run the API or database itself. If the tunnel or backend is unavailable, sign-in and other cloud-backed features will not work. A different reachable backend can be used, but its address must be configured in the app before building it.

## iPhone

### Build and connect the iPhone

Build the iOS app in Xcode using the `Aera.xcworkspace` and a valid Apple development team. A successful build means Xcode compiled the app; the app still needs to be installed and trusted on the phone.

Connect the iPhone to the Mac, unlock it, and follow any pairing prompts. If the iPhone asks whether to trust this computer, tap **Trust** and enter the iPhone passcode. In Xcode, confirm that the connected iPhone is selected as the run destination, then run the app.

> **Screenshot 1 — Successful build:** Insert a screenshot showing Xcode reporting that the Aera build succeeded.

### If iPhone reports a host, connection, or trust error

Capture the exact error and use it to identify which step failed. A host or pairing error means Xcode and the iPhone are not communicating; it is different from an untrusted-developer warning shown when opening an app that has already been installed.

For a connection or pairing error, reconnect the cable, unlock the iPhone, accept **Trust This Computer** if prompted, and check that Xcode recognizes the phone. Keep the Mac and iPhone connected while Xcode installs and launches the app.

> **Screenshot 2 — Initial error:** Insert the screenshot of the exact host, pairing, or app-trust error shown on the iPhone or in Xcode.

> **Screenshot 3 — iPhone connection prompt:** Insert a screenshot of the iPhone unlocked and connected to the Mac, showing the **Trust This Computer** prompt if it appears. Do not include a passcode.

### Trust the developer app on iPhone

If the app has installed but iOS says the developer is not trusted or cannot verify the app, connect the iPhone to the internet, then open:

**Settings → General → VPN & Device Management**

Under **Developer App**, tap the developer profile used to sign the build, tap **Trust [developer name]**, and confirm. The exact labels can vary slightly by iOS version. Return to the Home Screen and open Aera.

If the app does not appear under **Developer App**, or the error happens before installation completes, trusting a profile will not fix it. Check the Xcode signing team, provisioning profile, device registration, and connection/pairing status instead. Do not trust a developer profile unless you recognize the team that signed the app.

> **Screenshot 4 — Trust the developer profile:** Insert a screenshot of **Settings → General → VPN & Device Management**, showing the relevant developer profile and its **Trust** action. Redact account details if needed.

> **Screenshot 5 — Developer profile trusted:** Insert a screenshot showing the developer profile after it has been trusted, if iOS displays a confirmation screen.

## Confirm installation

After the app is installed and trusted, return to the iPhone Home Screen and check that Aera appears with the other apps. Tap its icon to open it.

> **Screenshot 6 — Aera installed on iPhone:** Insert a screenshot of the iPhone Home Screen showing the Aera app icon among the other apps.

## Android

### Obtain the APK

Download the versioned, production-signed Aera APK from the project's [GitHub Releases](https://github.com/tushar6076/Aera/releases) page. Open the latest release and download its Android APK asset directly to the phone, or download it on a computer and transfer it to the phone. Install only an APK published by the Aera project.

The earlier locally generated APK uses Android's default debug signing key and is not a user release. A production-signed update must use the same private release key as the installed production version so Android can verify it as an update. Keep that key and its passwords private and backed up.

> **Screenshot 7 — Aera GitHub Release:** Insert a screenshot of the published release showing its version and production-signed Android APK asset.

### Install the downloaded APK

On the phone, open the downloaded APK from the browser's download notification or from **Files → Downloads**. Android may ask permission to install apps from that source. If prompted, open the system settings from the prompt, allow installs only for the browser or file manager you used, then return and tap the APK again. The exact menu labels vary by Android version and device manufacturer.

Review the installer prompt and tap **Install**. When installation completes, tap **Open**. If Android warns that the file is not from the expected Aera release, cancel the installation and verify its source instead of bypassing the warning. You can turn off the temporary “install unknown apps” permission afterward.

> **Screenshot 8 — Allow installation from the selected source:** Insert a screenshot of the Android permission screen for the browser or file manager used to download the APK. Do not show personal account details.

> **Screenshot 9 — Aera installation completed:** Insert a screenshot of Android's successful installation screen with the **Open** action.

### Confirm installation

Confirm that the Aera icon appears in the app drawer, then open it. The phone needs internet access to sign in and use cloud-backed features; the Aera backend and its Cloudflare Tunnel must also be available.

> **Screenshot 10 — Aera installed on Android:** Insert a screenshot of the app drawer or Home Screen showing the Aera app icon.

The Android installation flow does not require Android Studio, a terminal, USB debugging, or ADB. Those tools are for development and device testing, not end-user installation.
