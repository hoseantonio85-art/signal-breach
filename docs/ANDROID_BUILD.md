# R1 — Android debug build (Capacitor 8)

**Status (2026-11-01):** First debug APK **built and uploaded successfully** in [Actions run 41243617194](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41243617194); artifact `signal-breach-android-debug` (ZIP with `app-debug.apk`, expires 2026-11-14). **Real Android device QA has not yet been performed.**

## What is implemented
- The ordinary Vite build keeps `/signal-breach/` for GitHub Pages.
- `npm run build:android` builds relative paths (`./`) and validates the output.
- Unbounded Variable (weights 200–900, Cyrillic and Latin) is bundled as local WOFF2 through `@fontsource-variable/unbounded@5.3.0`; its SIL OFL license is at `licenses/UNBOUNDED-OFL.txt`.
- Test-only Tektur/Russo are never requested in Android; the Android HTML strips all Google Fonts links.
- Capacitor 8.6.0 generates the native Android shell, with `webDir: dist`, through a gitignored `capacitor.config.json`.
- The owner approved the permanent Android application ID `com.hoseantonio85.signalbreach` on 2026-11-01. The native CI job runs automatically on branch push / PR. No signing secrets are committed.

## Android application ID (approved)
`com.hoseantonio85.signalbreach` — approved 2026-11-01. It is fixed in `scripts/configure-android.mjs`, and must remain the same for all subsequent Android builds. The generated Capacitor configuration is gitignored; no GitHub Actions variable is required.

## Local (Node 22+, JDK 21, Android SDK)
```sh
npm install
npm run build                 # existing Pages build
npm run build:android         # Android offline assets, no package ID needed
npm run android:init          # generates android/ and syncs dist
(cd android && ./gradlew assembleDebug)
npm run android:sync          # after modifying web code; then assemble again
```

## GitHub Actions
1. Push to `release/android-rustore-v1`, or trigger the Android workflow in Actions.
2. The `offline-web-bundle` job checks TypeScript, 6 engine tests, HTML URLs, CSS and local WOFF2. `debug-apk` then generates native Android and builds via Gradle using the approved ID.
3. Under a successful workflow's **Artifacts**, download `signal-breach-android-debug`, unpack its ZIP and install `app-debug.apk` on Android.

## R1 exit criteria (not yet met)
- [x] Actual APK artifact in [GitHub Actions run 41243617194](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41243617194).
- [ ] Offline launch on real Android, not only a successful web build.
- [ ] RU/EN, Unbounded, sound, gameplay, 16×30 map, status bar and safe areas checked on device.
- [x] Pages source unchanged (`main`); [ ] perform post-install web visual smoke test.

The `android/` directory is deliberately regenerated in CI at this preparation stage; review and version native customizations once the package ID is approved. R2 still includes Android Back, save/resume, background pausing and session protection.

## Branded launcher icon
The default Capacitor icon is overridden **after** `npm run android:init` and **before** `assembleDebug` by `python3 scripts/generate-android-icons.py android`. The source uses the already approved main-menu sigil (cyan diamond + solid magenta square, dark background), **not** a new logo.

The Python 3 script needs no pip packages and deterministically writes:
- legacy `ic_launcher.png`, `ic_launcher_round.png` at mdpi–xxxhdpi;
- adaptive foreground at mdpi–xxxhdpi, dark XML background and adaptive icon XML;
- a monochrome mask for Android 13+ themed icons.

The native directory is regenerated in CI, so the generator is part of the release build and must be kept in the repository. **First successful branded-icon APK:** [Actions run 41247085110](https://github.com/hoseantonio85-art/signal-breach/actions/runs/41247085110), artifact `signal-breach-android-debug`. Verify the resulting launcher icon on a real device and in the RuStore icon upload before release.

**IMPORTANT: Existing player data.** The initial installed debug APK may use a different auto-generated debug signing certificate. Updating it in-place can fail; uninstalling can wipe campaign progress. Do not ask the tester to uninstall or overwrite their OP 07/08 progress until an export/import or verified recovery path exists. Track in [issue #7](https://github.com/hoseantonio85-art/signal-breach/issues/7).
