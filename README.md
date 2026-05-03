# Pressed To Impress iOS App

This workspace now includes:

- A SwiftUI iPhone app that wraps the Pressed To Impress Image Quality Checker website in a native shell
- An Android app scaffold that wraps the same checker page in a native WebView shell
- A Windows-friendly browser preview you can run locally right away

## What is included

- A SwiftUI app entry point
- A `WKWebView` screen pointing at the live checker page
- Native loading and error overlays
- Back, forward, reload, and share controls
- External links opened in Safari instead of trapping users in the web view
- A local `windows-preview` PWA-style shell for browser testing

## Use on Windows right now

1. Double-click `Start-Preview.bat`
2. Or double-click `windows-preview/index.html`
3. If the embedded view is blocked, click `Open Live Checker`

This opens a browser-based app preview you can test from Windows immediately.

## Open on a Mac

1. Open `PressedToImpressChecker.xcodeproj` in Xcode 16 or newer.
2. Set your Apple Developer team in Signing & Capabilities.
3. Pick an iPhone simulator or device.
4. Build and run.

## Open on Android

1. Open `PressedToImpressAndroid` in Android Studio.
2. Let Gradle sync.
3. Run the `app` configuration on an Android emulator or device.

Main Android code lives in `PressedToImpressAndroid/app/src/main/java/nz/co/pressedtoimpress/checker/MainActivity.kt`.

## Before shipping

- Replace the placeholder app icon in `Assets.xcassets/AppIcon.appiconset`.
- Confirm the website flow works well inside `WKWebView`, especially image upload and any checkout or account flows.
- Camera and photo-library permission strings are already included; adjust the wording if you want something more brand-specific.
