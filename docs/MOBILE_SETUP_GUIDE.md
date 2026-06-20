# WOLFITNESS Expo Mobile Setup Guide

This guide explains how to set up, run, test, and build `wolfitness-expo` on a completely different machine with no prior project knowledge assumed.

Repository root used by this guide: `wolfitness-expo/`

## 1. Project Overview

### What WOLFITNESS Expo is

WOLFITNESS Expo is the mobile athlete application for the Wolfitness platform. It provides:

- Authentication with Supabase.
- Athlete onboarding flows.
- Dashboard and profile views.
- Workout playback and session tracking.
- Nutrition logging and macro target management.
- AI nutrition assistant access.
- Marketplace browsing and program enrollment or purchase handoff.

This mobile app does not contain the full backend. Some features call the companion Wolfitness web/backend system.

### Tech stack

- Expo SDK `54` via local `expo` package.
- React Native `0.81.5`.
- TypeScript `~5.9.2`.
- Expo Router for navigation and deep linking.
- Supabase client SDK for auth and database access.
- TanStack React Query for client-side data fetching.
- NativeWind for styling.
- EAS for cloud builds and development clients.

### Required services

- Supabase: required.
  Used for auth, session handling, onboarding persistence, profiles, workouts, nutrition logs, enrollments, and marketplace data.
- Wolfitness web/backend API: required for full feature coverage.
  Used by mobile for AI nutrition and purchase initialization through `EXPO_PUBLIC_API_URL`.
- Stripe: indirectly required for paid purchases.
  Stripe is not configured in the mobile app directly. Paid purchase flow is delegated to the Wolfitness web backend.
- OpenAI: indirectly required for AI nutrition features.
  OpenAI keys are not stored in the mobile app. AI calls are delegated to the Wolfitness web backend.

### Important architecture note

This repository contains Supabase seed SQL in `supabase/seed/`, but it does **not** contain the full Supabase schema migrations required to create every table the app uses. In practice you need one of these:

1. An existing Wolfitness Supabase project that already has the schema.
2. The companion `wolfitness` web repository to apply the real `supabase/migrations/` schema before using this mobile app.

## 2. System Requirements

### Supported operating systems

- macOS: recommended for the best developer experience, Android and iOS support.
- Windows: supported for Android development and physical device testing.
- Linux: supported for Android development and physical device testing.

### Required software versions

| Tool | Required version | Notes |
| --- | --- | --- |
| Node.js | `20.x LTS` recommended | Stable choice for Expo SDK 54 and EAS CLI. |
| npm | `10.x` recommended | Comes with Node.js 20. This repo uses `package-lock.json`. |
| Yarn | Not used | Do not use unless your team intentionally switches package managers. |
| pnpm | Not used | Do not use unless your team intentionally switches package managers. |
| Expo CLI | Use local `expo@~54.0.33` via `npx expo` | Do not install the legacy global `expo-cli`. |
| EAS CLI | `>= 18.12.2` | Required for cloud builds. |
| Git | Current stable | Required to clone the repository. |

### Platform-specific tooling

#### macOS

- Xcode: required for iOS Simulator and local iOS native runs.
- Android Studio: required for Android Emulator.
- CocoaPods: commonly required for native iOS workflows.

#### Windows

- Android Studio: required for Android Emulator.
- Use PowerShell or Command Prompt.
- iOS Simulator is not available on Windows.

#### Linux

- Android Studio: required for Android Emulator.
- iOS Simulator is not available on Linux.

### Recommended machine minimums

- 16 GB RAM recommended.
- 20 GB free disk space recommended.
- Stable internet connection for npm installs, EAS builds, and Expo tooling.

## 3. Clone Project

Choose one clone method.

### HTTPS

```bash
git clone https://github.com/DEPUSTORES/wolfitness-expo.git
cd wolfitness-expo
git checkout main
```

### SSH

```bash
git clone git@github.com:DEPUSTORES/wolfitness-expo.git
cd wolfitness-expo
git checkout main
```

### Verify the clone

```bash
pwd
ls
```

You should see files such as:

- `app.json`
- `eas.json`
- `package.json`
- `.env.example`
- `app/`
- `src/`

## 4. Install Dependencies

### Install Node dependencies

```bash
npm install
```

This project uses `npm` and `package-lock.json`. Stay consistent and avoid mixing package managers.

### Verify the install

```bash
npx expo --version
npx eas --version
npm ls expo expo-router @supabase/supabase-js
```

Expected outcomes:

- `npx expo --version` should resolve using the local project dependency.
- `npx eas --version` should print an installed EAS CLI version.
- `npm ls` should show installed dependency trees without fatal errors.

### Install EAS CLI if missing

If `npx eas --version` fails, install EAS CLI globally:

```bash
npm install -g eas-cli
eas --version
```

### Common installation issues

- `patch-package` fails during `npm install`
  Re-run `npm install`. This repo runs `patch-package` in `postinstall`.
- `expo` command not found
  Use `npx expo ...` instead of relying on a global CLI.
- Native dependency mismatch after pulling changes
  Delete `node_modules` and reinstall:

```bash
rm -rf node_modules
npm install
```

- Old npm version
  Upgrade Node.js to current `20.x LTS`, then retry.

## 5. Environment Variables

This app currently reads exactly three environment variables.

Create a local `.env` file in the repository root by copying `.env.example`.

```bash
cp .env.example .env
```

### Environment variable reference

| Variable | Description | Example value | Where to obtain it |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Public Supabase project URL used by the mobile client SDK. | `https://your-project-ref.supabase.co` | Supabase Dashboard -> Project Settings -> API -> Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous client key used by the mobile app. | `eyJhbGciOiJI...<anon-key>` | Supabase Dashboard -> Project Settings -> API -> `anon` / publishable key |
| `EXPO_PUBLIC_API_URL` | Base URL of the Wolfitness web/backend app used for AI nutrition and purchase initialization. | `http://192.168.1.25:3000` or `https://api.example.com` | Your running or deployed `wolfitness` web environment |

### Important notes

- Never put service role keys in this mobile app.
- Never put Stripe secret keys in this mobile app.
- Never put OpenAI secret keys in this mobile app.
- `EXPO_PUBLIC_API_URL` must not be `localhost` when testing on a physical device.
- On a physical device, use your computer's LAN IP such as `http://192.168.1.25:3000`.

### Example `.env.example`

The repository already includes a `.env.example`. Its effective content is:

```env
## wolfitness-expo environment
##
## Copy to `.env` and fill in values.
## IMPORTANT: `.env` must never be committed.

# Supabase (public client config)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Wolfitness web backend base URL (used by mobile AI nutrition + purchases)
# Local development on a physical device: do NOT use localhost. Use your Mac LAN IP.
# Example: http://192.168.1.25:3000
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

## 6. Supabase Setup

### What Supabase is used for in this app

The app uses Supabase for:

- Email/password auth.
- Google OAuth through Supabase Auth.
- Password reset flows.
- Persistent sessions.
- Onboarding and profile data.
- Programs, coaches, enrollments, workouts, nutrition logs, and other relational data.

### Step 1: Create or choose a Supabase project

1. Sign in to Supabase.
2. Create a new project, or use an existing Wolfitness project.
3. Wait for the project to finish provisioning.

### Step 2: Apply the database schema

This repo alone is not enough to create the full database schema.

Reason:

- `wolfitness-expo/supabase/` contains seed data only.
- The full schema migrations live in the companion `wolfitness` web repository.

Recommended setup paths:

1. Preferred: use an existing Wolfitness Supabase project that already has the correct schema.
2. Full local platform setup: clone the companion `wolfitness` repository and apply its Supabase migrations before using `wolfitness-expo`.

If your team uses Supabase CLI from the web repo, the flow is typically:

```bash
cd ../wolfitness
supabase link --project-ref <your-project-ref>
supabase db push
```

Only run the above if your team actually manages schema with Supabase CLI in the web repo.

### Step 3: Optionally load seed data from this repo

If you want sample mobile data, review:

- `supabase/seed/README.md`
- `supabase/seed/00_seed.sql`

Important:

- The seed files require real `auth.users.id` values.
- You must replace hardcoded UUID references before executing them.

### Step 4: Obtain the public keys

From Supabase Dashboard:

1. Open your project.
2. Go to `Project Settings`.
3. Open `API`.
4. Copy:
   - Project URL
   - Anon / publishable key

Put those into `.env`.

### Step 5: Configure authentication

In Supabase Dashboard -> Authentication:

1. Enable Email auth if you want email/password sign in.
2. Enable Google provider if you want Google sign in.
3. Configure your site URL and redirect URLs.

### Required redirect URLs

This app uses the custom scheme defined in `app.json`:

- `wolfitnessexpo://auth/callback`
- `wolfitnessexpo://auth/reset-password`

Add both to Supabase Auth redirect URLs.

### Google OAuth note

Google sign in is implemented through Supabase OAuth. For reliable testing, use a development build or production build with the stable `wolfitnessexpo` scheme.

Expo Go can generate runtime-specific callback URLs during local development. Because those URLs are not stable, OAuth testing is significantly more reliable in a dev build than in Expo Go.

### Verification steps

Verify Supabase configuration with this checklist:

1. `.env` contains `EXPO_PUBLIC_SUPABASE_URL`.
2. `.env` contains `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Supabase redirect URLs include:
   - `wolfitnessexpo://auth/callback`
   - `wolfitnessexpo://auth/reset-password`
4. Email auth is enabled if testing email/password.
5. Google auth is enabled if testing Google sign in.

## 7. Expo Configuration

The app configuration lives in `app.json`.

### Current key values

- App name: `Wolfitness`
- Slug: `wolfitness-expo`
- Scheme: `wolfitnessexpo`
- iOS bundle identifier: `com.sarth.wolfitnessexpo`
- Android package name: `com.sarth.wolfitnessexpo`

### What these settings mean

- `scheme`
  Controls deep links such as `wolfitnessexpo://auth/callback`.
- `ios.bundleIdentifier`
  Identifies the iOS app in Apple tooling.
- `android.package`
  Identifies the Android app in Android tooling and Play Console.

### When you must change `app.json`

Change `app.json` if:

- You are publishing under a different Apple developer account.
- You are publishing under a different Android application ID.
- You want a different deep-link scheme.
- You are creating a forked white-label build.

### If you change the scheme

You must update all of these together:

1. `app.json`
2. Supabase Auth redirect URLs
3. Any backend allowlist that expects `wolfitnessexpo://...`

Important:

The companion Wolfitness web/backend purchase flow expects mobile return URLs such as `wolfitnessexpo://purchase/success`. If you change the scheme, the backend allowlist must also be updated.

## 8. Running Locally

### Baseline commands

```bash
npm install
npx expo start
```

If you change `.env`, restart Expo with a cleared cache:

```bash
npx expo start -c
```

### Expo Go

Expo Go is the fastest way to open the app on a physical device for UI iteration.

Basic flow:

1. Install Expo Go on your phone.
2. Run `npx expo start`.
3. Scan the QR code shown by Expo.
4. Wait for the bundle to load.

Use Expo Go when:

- You are checking layout or navigation.
- You are testing standard JavaScript changes.
- You do not need production-parity native behavior.

### Development Build

This repository is positioned as an Expo + EAS development-client app. Use a development build when you need stable native behavior and production-like auth/deep-link testing.

Use a development build when:

- You are testing Google OAuth.
- You want a stable custom scheme.
- You are validating native module behavior.
- You want closer parity with release builds.

### Android emulator

1. Install Android Studio.
2. Create and boot an Android Virtual Device.
3. Start the app:

```bash
npx expo start
```

4. In the Expo terminal UI, press `a` to open Android if the emulator is already running.

Alternative native run:

```bash
npx expo run:android
```

### iOS simulator

macOS only.

1. Install Xcode.
2. Open an iOS Simulator.
3. Start the app:

```bash
npx expo start
```

4. In the Expo terminal UI, press `i` to open iOS if Simulator is already running.

Alternative native run:

```bash
npx expo run:ios
```

### Physical device

Physical device testing is strongly recommended for:

- Deep links.
- Auth redirects.
- Device-specific UI behavior.
- Purchase return flow testing.

For physical devices:

- The device and your computer must be on the same network for local development.
- `EXPO_PUBLIC_API_URL` must use your machine LAN IP, not `localhost`.

## 9. Building APK

### Install and verify EAS CLI

```bash
npm install -g eas-cli
eas --version
```

This repo requires EAS CLI `>= 18.12.2`.

### Log in to Expo

```bash
eas login
```

### Build profiles in this repo

Defined in `eas.json`:

- `development`
  Internal distribution, development client.
- `preview`
  Internal distribution, Android builds as APK.
- `production`
  Release build with auto-increment enabled.

### Android preview APK

```bash
eas build --profile preview --platform android
```

Use this when you want:

- A shareable Android APK.
- Manual QA on devices.
- Internal testing outside Expo Go.

### Android development build

```bash
eas build --profile development --platform android
```

Use this when you want:

- A development client.
- Stable native testing.
- Better auth/deep-link fidelity than Expo Go.

### Android production build

```bash
eas build --profile production --platform android
```

By default, Android production builds usually target Play Store distribution, commonly as an AAB. Confirm the final artifact in the EAS build output for your account and project configuration.

### If you need an Android AAB specifically

Use the production profile and confirm that your EAS project is configured for store submission output. If your team requires an explicit AAB-only workflow, review or extend `eas.json` before building.

### Summary

- APK: use `preview` for internal installs.
- Dev client: use `development`.
- Production release: use `production`.

## 10. Installing APK

### Step 1: Download the build artifact

After EAS finishes:

1. Open the EAS build page.
2. Download the APK file to your machine.

### Step 2: Transfer the APK to the device

Use one of these methods:

- USB cable
- AirDrop
- Google Drive
- Slack
- Email

### Step 3: Allow installation from unknown apps

On Android:

1. Open the APK file.
2. If prompted, enable installation from that source.
3. Return to the installer.
4. Continue installation.

### Step 4: Install the APK

1. Tap the APK.
2. Tap `Install`.
3. Wait for installation to complete.
4. Open the app.

### Placeholder screenshot notes

- `[Screenshot placeholder: EAS build download page]`
- `[Screenshot placeholder: Android "Allow from this source" settings screen]`
- `[Screenshot placeholder: Android package installer confirmation screen]`

## 11. iOS Setup

### Apple account requirements

- iOS Simulator on macOS: no paid Apple Developer Program required for simulator-only testing.
- Real device builds and TestFlight distribution: paid Apple Developer Program membership is typically required.

### Build with EAS

Development build:

```bash
eas build --profile development --platform ios
```

Production build:

```bash
eas build --profile production --platform ios
```

### TestFlight

Typical TestFlight flow:

1. Build the iOS production artifact with EAS.
2. Upload or submit through the configured EAS/Apple workflow.
3. Wait for App Store Connect processing.
4. Add internal or external testers in TestFlight.

### iOS-specific note

If you change the bundle identifier in `app.json`, you must also align:

- Apple App ID
- provisioning profile expectations
- EAS credentials
- any auth redirect configuration tied to the app identity

## 12. Troubleshooting

### Metro bundler issues

Symptoms:

- App hangs on loading.
- Changes do not appear.
- Module resolution errors appear after dependency changes.

Fix:

```bash
npx expo start -c
```

If that fails:

```bash
rm -rf node_modules
npm install
npx expo start -c
```

### Expo cache issues

Symptoms:

- Old environment values still appear.
- App still behaves like an older build.

Fix:

```bash
npx expo start -c
```

Also fully close the app on the device or simulator and reopen it.

### Android emulator issues

Symptoms:

- No emulator is detected.
- `a` does nothing in the Expo terminal.

Fix:

1. Start the emulator manually from Android Studio Device Manager.
2. Wait until Android fully boots.
3. Re-run `npx expo start`.

### Deep link issues

Symptoms:

- Google sign in returns to the browser instead of the app.
- Password reset email opens but does not hydrate the mobile session.

Fix:

1. Verify `scheme` in `app.json` is `wolfitnessexpo`.
2. Verify Supabase redirect URLs include:
   - `wolfitnessexpo://auth/callback`
   - `wolfitnessexpo://auth/reset-password`
3. Prefer a development build for OAuth testing instead of Expo Go.

### Supabase auth issues

Symptoms:

- Sign in fails immediately.
- Signup works but no session is restored.
- Reset password route says the link is invalid.

Fix:

1. Confirm `EXPO_PUBLIC_SUPABASE_URL` is correct.
2. Confirm `EXPO_PUBLIC_SUPABASE_ANON_KEY` is correct.
3. Confirm the Supabase Auth provider is enabled.
4. Confirm redirect URLs are registered exactly.
5. Confirm the backend schema exists and required tables are present.

### API URL issues

Symptoms:

- AI nutrition fails.
- Purchases do not start.
- Mobile app logs warnings about API configuration.

Fix:

1. Verify `EXPO_PUBLIC_API_URL` is set.
2. On a physical device, replace `localhost` with your machine LAN IP.
3. Verify the companion `wolfitness` web app is running and reachable from the device.

### Missing environment variables

Symptoms:

- App shows configuration errors.
- Supabase client falls back to placeholders and auth cannot work.

Fix:

1. Confirm `.env` exists at repo root.
2. Confirm all three `EXPO_PUBLIC_*` variables are present.
3. Restart Expo after any `.env` change:

```bash
npx expo start -c
```

## 13. Verify Application

Use this checklist after setup.

- Login works with email/password.
- Signup works with email/password.
- Google sign in works if the provider is enabled.
- Password reset email flow opens the mobile reset route.
- Onboarding flow can be completed.
- Dashboard loads after authentication.
- Marketplace loads.
- Program detail loads.
- Workout screen loads and can start or resume a session.
- Nutrition tracker loads.
- AI nutrition assistant works if `EXPO_PUBLIC_API_URL` points to a running backend with AI enabled.
- Purchases work if `EXPO_PUBLIC_API_URL` points to a running backend with Stripe configured.

## 14. Deployment Checklist

### Pre-release checklist

- `npm install` completes cleanly.
- `.env` values point to the correct target environment.
- Supabase Auth redirect URLs are registered for the shipping app scheme.
- Production bundle identifier and package name are correct.
- The backend allowlist supports the mobile deep-link scheme used for purchase return.

### Environment checklist

- `EXPO_PUBLIC_SUPABASE_URL` points to the correct Supabase project.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the correct anon key for that project.
- `EXPO_PUBLIC_API_URL` points to the correct backend environment.
- Stripe is configured on the backend if testing paid purchases.
- OpenAI is configured on the backend if testing AI nutrition.

### Build checklist

- `eas login` completed with the correct Expo account.
- Correct EAS profile selected:
  - `development`
  - `preview`
  - `production`
- Android artifact type is correct for the release target.
- iOS credentials are correct if shipping to TestFlight or App Store.
- Smoke test was performed on a physical device.

## 15. Security Notes

- Never commit `.env`.
- Never expose Supabase service role keys in the mobile app.
- Never expose Stripe secret keys in the mobile app.
- Never expose OpenAI secret keys in the mobile app.
- Only `EXPO_PUBLIC_*` values intended for client-side use belong in this repository.
- Treat `EXPO_PUBLIC_API_URL` as public configuration, not a secret.

## Repo Reference

Useful files for future maintainers:

- `app.json`
- `eas.json`
- `.env.example`
- `src/lib/supabase.ts`
- `src/providers/AuthProvider.tsx`
- `src/services/purchase.service.ts`
- `src/services/nutrition.service.ts`
- `supabase/seed/README.md`

