---
name: Athlete OS
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#121212'
  on-primary-container: '#7e7d7d'
  inverse-primary: '#5f5e5e'
  secondary: '#c8c6c3'
  on-secondary: '#31302f'
  secondary-container: '#474745'
  on-secondary-container: '#b7b5b2'
  tertiary: '#bccabb'
  on-tertiary: '#273329'
  tertiary-container: '#0a150c'
  on-tertiary-container: '#748174'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e5e2df'
  secondary-fixed-dim: '#c8c6c3'
  on-secondary-fixed: '#1c1c1a'
  on-secondary-fixed-variant: '#474745'
  tertiary-fixed: '#d8e6d6'
  tertiary-fixed-dim: '#bccabb'
  on-tertiary-fixed: '#131e14'
  on-tertiary-fixed-variant: '#3e4a3e'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.12em
  stats-number:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '300'
    lineHeight: '1'
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  margin-page: 32px
  gutter-grid: 24px
  stack-lg: 48px
  stack-md: 24px
  stack-sm: 12px
---

## Brand & Style
This design system embodies the concept of "Quiet Performance." It is tailored for high-performance athletes who value precision, discretion, and mental clarity. The aesthetic moves away from the aggressive, neon-soaked tropes of traditional fitness apps, leaning instead into a "Calm Luxury" movement.

The UI is inspired by high-end horology and editorial layout design. It prioritizes information density without clutter, using a "Matte Minimalism" style that emphasizes texture over transparency. Every interaction should feel intentional and dampened, evoking the sensation of a premium physical product rather than a digital screen.

## Colors
The palette is rooted in deep, matte architectural tones to reduce cognitive load and visual fatigue.

- **Backgrounds:** Use `primary_color_hex` (#121212) as the base canvas. Avoid pure black (#000000) to maintain a soft, paper-like matte finish.
- **Typography:** The primary text color is a warm off-white (#F4F1EE), which provides high legibility against the dark background without the harshness of pure white.
- **Accents:** Use Deep Emerald (#2E3A2F) for subtle status indicators or "optimal" states. Muted Bronze (#8C7851) is reserved for high-value targets, such as personal records or premium insights. Accents should never occupy more than 2% of any given view.

## Typography
The typography system relies on **Hanken Grotesk** for its precise, contemporary geometry. 

- **Hierarchy:** Dramatic contrast between large, light-weight display headers and small, high-tracking labels creates an editorial feel.
- **Tracking:** Increase tracking on all uppercase labels (`label-caps`) to 12% to enhance the luxury feel. 
- **Numerical Data:** For performance metrics (heart rate, pace, recovery scores), use the `stats-number` style with reduced letter spacing to give the data a "machined" and technical appearance.

## Layout & Spacing
This system utilizes a **Fluid Column Grid** with generous, fixed outer margins to maintain a centered, cinematic focus.

- **Desktop/Tablet:** 12-column grid with a maximum content width of 1440px. 
- **Mobile:** 4-column grid with 20px margins.
- **Rhythm:** Spacing follows a 4px baseline, but "Premium Air" is prioritized. Components should have significant vertical separation (`stack-lg`) to allow metrics to breathe. Never crowd data; if the screen feels full, move secondary data to a deeper layer.

## Elevation & Depth
Elevation in this system is achieved through **Tonal Layering** rather than traditional shadows. 

1. **Base (L0):** The primary background (#121212).
2. **Surface (L1):** Elements like cards or secondary sections use a slightly lighter Charcoal (#1A1A1A).
3. **Interactive (L2):** Hover states or focused elements use Graphite (#242424).

**Shadows:** When necessary for floating elements (like modals), use a single, ultra-diffused shadow: `0 20px 40px rgba(0,0,0,0.4)`. The shadow should feel like ambient occlusion, not a direct light source.
**Borders:** Use subtle, 1px solid strokes for all surfaces using `#242424` to define edges without adding visual weight.

## Shapes
The shape language is defined by "Soft Precision."

- **Containers:** All primary cards and containers use `ROUND_SIXTEEN` (1rem / 16px). This softens the technical nature of the data.
- **Interactive Elements:** Buttons and input fields use `ROUND_TWELVE` (0.75rem / 12px) to provide a distinct tactile difference from the outer containers.
- **Data Points:** Small chips or status tags use a full pill radius to differentiate them from functional containers.

## Components
- **Buttons:** Primary buttons are Off-White with Charcoal text. Secondary buttons are Ghost-style with a subtle 1px border (#242424). No gradients or glows.
- **Cards:** Cards should have no background by default, defined only by a 1px border. If grouped, use the L1 Surface background (#1A1A1A) with no border.
- **Metrics Displays:** Use a "label-over-data" vertical stack. The label uses `label-caps` in a 50% opacity off-white, while the data uses `stats-number`.
- **Inputs:** Minimalist bottom-border only or subtle 1px outlined box. The focus state should only be a slight increase in border brightness or a tiny bronze dot next to the label.
- **Progress Bars:** Use a thin 2px height. The "track" is Graphite (#242424) and the "fill" is Off-White or Deep Emerald for health indicators.
- **Lists:** High-density lists (e.g., workout splits) should use 1px dividers with 16px of vertical padding per row to maintain the "Airy" requirement.