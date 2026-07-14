# wolfitness-expo (Mobile)

Expo mobile app for the Wolfitness athlete experience. This app owns the native athlete UI and talks to Supabase, the Signal backend, and the Wolfitness web backend for server-side workflows.

## What’s In This App Today

- Auth: email/password + Google OAuth through Supabase PKCE.
- Pre-auth onboarding: goal, profile, equipment, injury, measurement, and availability capture.
- Athlete dashboard: training, nutrition, progress, Wolf AI, and active Signal program overview.
- Workout engine: legacy and Signal workout player, session restore, set logging, save-and-exit, discard, finish, history, and summaries.
- Signal programs: program marketplace/detail, active day selection, lifecycle reset/unjoin/restart, calendar strip, and progression.
- Nutrition tracking: daily logs, macro targets, quick log, add meal, and AI assistant.
- Meal Photo AI: photo selection, backend image analysis, editable meal draft, totals, and save-to-log flow.
- Wolf AI: daily goal insight, nutrition/recovery suggestions, usage limits, cache-aware refresh, and guardrail/error states.
- Goal profile: user goal settings and target suggestions.
- Smart Sync: manual health metric entry and today’s health metric status.
- Marketplace and purchases: browse programs/coaches and start Stripe checkout through the Wolfitness web backend.
- Settings: support email, privacy, terms, and profile surfaces.

## Backend Responsibilities

The mobile app uses three main backend surfaces:

- Supabase: auth, database reads/writes, session state, nutrition logs, workout logs, profiles, and program data.
- Signal API: Signal program browsing and published workout payloads.
- Wolfitness web API: Wolf AI, Meal Photo AI, AI nutrition, purchases, and server-verified workflows.

## Routing Map

Top-level routes live in `app/`:

- `app/index.tsx`: entry redirector for auth/onboarding/session restore.
- `app/(auth)/*`: auth landing, sign-in, sign-up.
- `app/auth/callback.tsx`: OAuth callback handler.
- `app/auth/reset-password.tsx`: password reset callback handler.
- `app/(preauth-onboarding)/*`: pre-auth onboarding screens.
- `app/(tabs)/*`: home, workouts, nutrition, progress, profile, settings, history.
- `app/(marketplace)/*`: marketplace and legacy program/coach detail.
- `app/(signal)/*`: Signal program browsing/detail routes.
- `app/(modals)/*`: add meal, nutrition goals, AI assistant, Meal Photo AI, Smart Sync, goal profile, edit profile, workout detail, quick log.
- `app/purchase/success.tsx`: purchase return surface after web checkout.

Core code lives in `src/`:

- `src/providers/*`: auth, React Query, theme, and app providers.
- `src/screens/*`: screen implementations used by routes.
- `src/features/*`: feature-local components, hooks, services, libs, constants, and types.
- `src/services/*`: compatibility facades and global services.
- `src/hooks/*`: query/mutation facades and shared hooks.
- `src/lib/*`: Supabase client, routing/date helpers, Sentry, query client, and utilities.
- `src/config/*`: API URL configuration.

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required local values:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_SIGNAL_API_URL=http://<YOUR_MAC_LAN_IP>:3000
EXPO_PUBLIC_WOLFITNESS_API_URL=http://<YOUR_MAC_LAN_IP>:3001

EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_ENABLE_DEV=false
EXPO_PUBLIC_SENTRY_DEBUG=false

EXPO_PUBLIC_SUPPORT_EMAIL=
EXPO_PUBLIC_PRIVACY_URL=
EXPO_PUBLIC_TERMS_URL=
```

Notes:

- Do not use `localhost` or `127.0.0.1` for mobile API URLs on a physical device.
- `EXPO_PUBLIC_SIGNAL_API_URL` points to the Signal CMS/backend used for Signal programs and workout payloads.
- `EXPO_PUBLIC_WOLFITNESS_API_URL` points to the Wolfitness web app used for Wolf AI, Meal Photo AI, AI nutrition, and purchase initialization.
- `EXPO_PUBLIC_SENTRY_DSN` is safe to expose to the client and enables runtime event capture.
- Sentry source map upload requires CI/EAS-only credentials. Do not put `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, or `SENTRY_PROJECT` in the mobile `.env`.

After changing `.env`, restart Expo with a cleared cache:

```bash
npx expo start -c
```

## Local Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Useful scripts:

- `npm run start` — start Expo
- `npm run android` — run Android development build
- `npm run ios` — run iOS development build
- `npm run web` — start Expo web
- `npm run lint` — run Expo lint

## Web Backend Local Setup

When testing mobile against the local Wolfitness web app:

```bash
cd ../wolfitness
npm run dev:lan
```

Then set Expo:

```env
EXPO_PUBLIC_WOLFITNESS_API_URL=http://<YOUR_MAC_LAN_IP>:3001
```

For Signal local testing, run the Signal backend/CMS and set:

```env
EXPO_PUBLIC_SIGNAL_API_URL=http://<YOUR_MAC_LAN_IP>:3000
```

## Deep Linking

Configured scheme: `wolfitnessexpo` in `app.json`.

Auth callback routes:

- `app/auth/callback.tsx`
- `app/auth/reset-password.tsx`

If OAuth redirects fail, verify:

- the scheme matches `wolfitnessexpo`
- Supabase Auth redirect URLs include the expected callback URIs
- the app was restarted after env/config changes

## EAS Builds

EAS config lives in `eas.json`.

Profiles:

- `development`: dev client, internal distribution
- `preview`: internal Android APK
- `production`: production build with auto-increment

Common commands:

```bash
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform ios
```

For readable Sentry stack traces, configure these as EAS/CI secrets only:

```env
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

## Troubleshooting

- **Supabase not configured**: check `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- **App crashes on startup with API config error**: set both `EXPO_PUBLIC_SIGNAL_API_URL` and `EXPO_PUBLIC_WOLFITNESS_API_URL` to valid `http` or `https` origins.
- **Physical device cannot reach backend**: use LAN IP URLs, not `localhost`.
- **Wolf AI or Meal Photo AI failing**: confirm `EXPO_PUBLIC_WOLFITNESS_API_URL` points to a running web backend with AI provider env vars configured.
- **Signal programs failing**: confirm `EXPO_PUBLIC_SIGNAL_API_URL` points to the Signal backend/CMS.
- **Purchases not starting**: confirm the Wolfitness web backend has Stripe env vars configured and mobile points to `EXPO_PUBLIC_WOLFITNESS_API_URL`.
