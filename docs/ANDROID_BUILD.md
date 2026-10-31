# R1 — Android debug build (Capacitor 8)

**Status:** Android offline bundle and APK workflow prepared on `release/android-rustore-v1`. No APK / device QA is claimed until Actions publishes the artifact and a phone is tested.

## What is implemented
- The ordinary Vite build keeps `/signal-breach/` for GitHub Pages.
- `npm run build:android` builds relative paths (`./`) and validates the output.
- Unbounded Variable (weights 200–900, Cyrillic and Latin) is bundled as local WOFF2 through `@fontsource-variable/unbounded@5.3.0`; its SIL OFL license is at `licenses/UNBOUNDED-OFL.txt`.
- Test-only Tektur/Russo are never requested in Android; the Android HTML strips all Google Fonts links.
- Capacitor 8.6.0 generates the native Android shell, with `webDir: dist`, through a gitignored `capacitor.config.json`.
- Until the owner approves the final `applicationId`, the native job is **skipped**, not falsely reported as an APK success. No signing secrets are committed.

## Android application ID (owner decision)
Choose the long-term reverse-DNS package identifier before building. Set a repository **Actions variable** named `SIGNAL_ANDROID_APP_ID` in **Settings → Secrets and variables → Actions → Variables**. It is not a secret. The native CI job is disabled until it has a value.

## Local (Node 22+, JDK 21, Android SDK)
```sh
npm install
npm run build                 # existing Pages build
npm run build:android         # Android offline assets, no package ID needed
export SIGNAL_ANDROID_APP_ID="YOUR_APPROVED_PACKAGE_ID"
npm run android:init          # generates android/ and syncs dist
(cd android && ./gradlew assembleDebug)
npm run android:sync          # after modifying web code; then assemble again
```

## GitHub Actions
1. Set `SIGNAL_ANDROID_APP_ID` to the approved identifier.
2. Trigger another push on `release/android-rustore-v1`, or re-run the Android workflow in Actions.
3. The `offline-web-bundle` job checks TypeScript, 6 engine tests, HTML URLs, CSS and local WOFF2. `debug-apk` then generates native Android and builds via Gradle.
4. Under the successful workflow **Artifacts**, download `signal-breach-android-debug`, unpack its ZIP and install `app-debug.apk` on Android.

## R1 exit criteria (not yet met)
- Actual APK artifact in Actions.
- Offline launch on real Android, not only a successful web build.
- RU/EN, Unbounded, sound, gameplay, 16×30 map, status bar and safe areas checked on device.
- Pages remains unaffected (it builds only from stable `main`).

The `android/` directory is deliberately regenerated in CI at this preparation stage; review and version native customizations once the package ID is approved. R2 still includes Android Back, save/resume, background pausing and session protection.
