# Native Modules (Approved Stack)

This repo is an Expo + EAS Dev Client app. Native modules are fine, but each one:

- Requires an EAS dev-client rebuild when added/updated.
- Increases upgrade surface area (RN/Expo SDK bumps).
- Can impact binary size and build time.

Guideline: **Install native deps when we start using them**, but keep an **approved shortlist** so we make consistent choices.

## When A Rebuild Is Required

If you add/remove/upgrade any native module, you must rebuild your dev client:

- Android: `eas build --profile development --platform android`
- iOS: `eas build --profile development --platform ios`

Fast Refresh is not enough for native modules.

## Approved Modules (Now + Future)

| Capability | Recommended Package | Status | Notes |
|---|---|---|---|
| Date picker | `@react-native-community/datetimepicker` | In use | Native calendar/spinner. Good for DOB and simple date inputs. |
| Bottom sheet | `@gorhom/bottom-sheet` | Approved (future) | Great for action menus, exercise selection, nutrition actions. Uses Reanimated + Gesture Handler (already in repo). |
| Toasts | `react-native-toast-message` | Approved (future) | Use for network errors, “Saved”, etc. Keep toasts subtle to match Athlete OS. |
| Calendar views | `react-native-calendars` | Approved (future) | Useful for scheduling, habit/workout streaks, agenda views. Use only when we build calendar screens. |
| SVG rendering | `react-native-svg` | Approved (future) | Needed for SVG icons/illustrations and some chart libs. Prefer consistent icon sources (lucide/react-native-svg). |
| Charts | (TBD) | Evaluate later | Don’t lock-in early. Candidate: `react-native-gifted-charts`. Decide once we know which charts (sparklines, bars, time series) and performance needs. |
| Haptics | `expo-haptics` | In use | Keep a single haptics system. Avoid adding `react-native-haptic-feedback` unless we intentionally replace Expo’s haptics. |
| Image picking | `expo-image-picker` | Preferred | Prefer Expo’s module first. Only move to `react-native-image-picker` if we hit a hard limitation. |
| Camera | `expo-camera` (simple) / `react-native-vision-camera` (advanced) | Evaluate later | VisionCamera is powerful but heavy (permissions, frame processing). Use only if we truly need advanced camera features. |

## Why We Avoid “Install Everything Now”

Even if we expect to need something later (calendar, bottom sheet, SVG), preinstalling everything tends to:

- Slow down EAS dev-client builds.
- Add “native breakage” risk during Expo SDK upgrades.
- Increase dependency conflicts (especially chart/camera stacks).

This doc is the contract: we can move quickly later without debating packages each time.

## Current Reality Check (Repo Today)

- We already depend on `react-native-safe-area-context`, `react-native-reanimated`, and `react-native-gesture-handler`, which are common prerequisites for advanced UI.
- We added `@react-native-community/datetimepicker` for onboarding DOB.

