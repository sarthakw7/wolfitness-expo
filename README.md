# wolfitness-expo (Mobile)

Wolfitness mobile app built with Expo + Expo Router + Supabase. This repo focuses on athlete experience (auth/onboarding, training, nutrition, marketplace consumption) while delegating purchases, AI nutrition chat, and ledger operations to the Wolfitness web backend.

## What’s In This App Today

- Auth: email/password + Google OAuth (Supabase PKCE) with deep-link safe callbacks.
- Onboarding: pre-auth athlete onboarding flow persisted to Supabase and committed post-auth.
- Athlete dashboard: overview + navigation into core areas.
- Workout engine: workout player with session restore and execution flow.
- Nutrition tracking: daily logs + macro targets editing + quick log/add meal modal.
- AI nutrition assistant: calls Wolfitness web backend using `EXPO_PUBLIC_API_URL`.
- Progress analytics: athlete progress/consistency surfaces.
- Marketplace: browse programs, program detail, coach detail.
- Purchases: starts Stripe checkout via web backend and returns to mobile success route.

## Routing Map (Expo Router)

Top-level routes live in `app/`:

- `app/index.tsx`: entry redirector (auth/onboarding/workout session restore).
- `app/(auth)/*`: auth landing + sign-in + sign-up.
- `app/auth/callback.tsx`: OAuth callback handler (deep link).
- `app/auth/reset-password.tsx`: password reset handler (deep link).
- `app/(preauth-onboarding)/*`: onboarding screens (goal/sex/DOB/equipment/etc).
- `app/(tabs)/*`: main athlete tabs (home, workouts, nutrition, progress, profile).
- `app/(marketplace)/*`: marketplace and program/coach detail.
- `app/(modals)/*`: modal flows (add meal, nutrition goals, AI assistant, edit profile, workout detail, quick log).
- `app/purchase/success.tsx`: purchase return surface after web checkout.

Core UI/business logic lives in `src/`:

- `src/providers/*`: app providers (auth, react-query, theme).
- `src/lib/*`: supabase client, onboarding draft commit, query client, utilities.
- `src/services/*`: API + persistence services (nutrition, purchase, etc).
- `src/screens/*`: screen implementations used by routes.

## Local Development

1. Install deps:

```bash
npm install
```

2. Set environment:

Create/update `.env` with:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_URL=http://<YOUR_MAC_LAN_IP>:3000
```

Notes:
- Do not use `localhost` for `EXPO_PUBLIC_API_URL` on physical devices.
- `EXPO_PUBLIC_API_URL` should point at the `wolfitness` web app (used for AI nutrition + purchase init).

3. Start:

```bash
npx expo start
```

After changing `.env`, restart with a cleared cache:

```bash
npx expo start -c
```

## Deep Linking (Auth + Recovery)

Configured scheme is `wolfitnessexpo` (see `app.json`). Auth uses `expo-auth-session` + Supabase PKCE, and callbacks are handled by:

- `app/auth/callback.tsx`
- `app/auth/reset-password.tsx`

If OAuth redirects break, confirm:
- the scheme matches (`wolfitnessexpo`)
- Supabase Auth redirect URLs include the expected callback URIs for your environment

## EAS Builds

EAS config is in `eas.json` with profiles:
- `development` (dev client, internal distribution)
- `preview` (internal, Android APK)
- `production` (auto-increment)

Common commands:

```bash
eas build --profile development --platform ios
eas build --profile preview --platform android
eas build --profile production --platform ios
```

## Troubleshooting

- Supabase not configured: check `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`src/lib/supabase.ts`).
- AI nutrition calls failing: confirm `EXPO_PUBLIC_API_URL` points to the running/deployed web app (`src/services/nutrition.service.ts`).
- Purchases not starting: same `EXPO_PUBLIC_API_URL` requirement (`src/services/purchase.service.ts`).
