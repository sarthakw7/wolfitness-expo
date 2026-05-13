---
name: Quiet Strength
colors:
  surface: '#fafaf2'
  surface-dim: '#dadad3'
  surface-bright: '#fafaf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ec'
  surface-container: '#eeeee6'
  surface-container-high: '#e9e9e1'
  surface-container-highest: '#e3e3db'
  on-surface: '#1a1c18'
  on-surface-variant: '#424842'
  inverse-surface: '#2f312c'
  inverse-on-surface: '#f1f1e9'
  outline: '#737971'
  outline-variant: '#c2c8bf'
  surface-tint: '#47664b'
  primary: '#47664b'
  on-primary: '#ffffff'
  primary-container: '#86a789'
  on-primary-container: '#1f3c25'
  inverse-primary: '#adcfaf'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5d5f5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#9e9f9b'
  on-tertiary-container: '#343633'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8ebca'
  primary-fixed-dim: '#adcfaf'
  on-primary-fixed: '#03210c'
  on-primary-fixed-variant: '#304d35'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e3e3de'
  tertiary-fixed-dim: '#c6c7c2'
  on-tertiary-fixed: '#1a1c19'
  on-tertiary-fixed-variant: '#454744'
  background: '#fafaf2'
  on-background: '#1a1c18'
  surface-variant: '#e3e3db'
typography:
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.15em
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 24px
  container-padding-desktop: 64px
  gutter: 16px
  section-gap: 48px
---

## Brand & Style
The design system is rooted in "Editorial Minimalism," evoking the feeling of a high-end wellness journal rather than a traditional fitness utility. It targets a discerning audience that values focus, clarity, and "quiet luxury." The aesthetic avoids the loud, neon-soaked tropes of the fitness industry in favor of a "Modern Organic" approach.

The emotional response should be one of calm empowerment. High-contrast serif headlines provide a sense of authority and timelessness, while generous whitespace ensures the user never feels overwhelmed by data. Visual interest is maintained through razor-thin hairlines and a disciplined application of a muted sage accent, suggesting growth and balance rather than raw aggression.

## Colors
The palette is centered on the "Modern Organic" concept. The primary accent is **Muted Sage (#86A789)**, used sparingly for calls to action and progress indicators to signify natural vitality. 

The foundation relies on **Bone (#F5F5F0)** and **Off-White (#FAFAFA)** for surfaces, creating a warm, breathable environment that is softer on the eyes than pure white. **Deep Charcoal (#1A1A1A)** is used for primary text and brand-defining strokes to ensure maximum readability and a premium feel. Functional neutrals include a subtle stone grey for hairlines and inactive states, maintaining the low-contrast, high-sophistication look.

## Typography
This design system employs a sophisticated dual-type approach. **Playfair Display** is used for headlines to convey an editorial, premium tone. It should be set with tight leading and slight negative letter-spacing for large displays.

**Montserrat** serves as the functional workhorse for body text and UI labels. To achieve the "wide-tracked" look, UI labels and small caps are given significant letter-spacing (0.1em to 0.15em), enhancing the sense of luxury and airiness. Body copy remains at a comfortable weight to ensure legibility against warm-toned backgrounds.

## Layout & Spacing
The layout follows a fluid grid with generous margins to enforce the minimalist aesthetic. A 12-column grid is used for desktop, while a 4-column grid is standard for mobile. 

The spacing rhythm is based on an 8px base unit, but emphasizes "negative space" as a functional element. Elements should be grouped tightly, but sections must be separated by significant vertical gaps (section-gap) to allow the eye to rest. Margins are intentionally wider than standard apps (24px on mobile) to frame content like a high-end magazine.

## Elevation & Depth
Depth is expressed through "Tonal Layers" and "Low-Contrast Outlines" rather than heavy shadows. Surfaces are distinguished by subtle shifts in tone (e.g., a Bone card on an Off-White background).

Where separation is required, use razor-thin (0.5pt to 1pt) hairlines in a muted stone color. If a shadow is absolutely necessary for a floating action button, it should be an ambient, highly diffused shadow with a low opacity (4-8%) and a slight tint of the Muted Sage or Charcoal to keep it integrated with the organic palette.

## Shapes
The shape language is controlled and modern. All buttons and containers utilize an 8px corner radius (Rounded), providing a soft but disciplined feel. The 'W' logo mark is a geometric abstraction—constructed from precise 45-degree angles—that balances the organic softness of the palette with architectural strength.

## Components
- **Buttons**: Flat styling with an 8px radius. Primary buttons use the Deep Charcoal with Off-White text; secondary buttons use the Muted Sage with Charcoal text. No heavy gradients or gloss.
- **Input Fields**: Minimalist "underline-only" style for a clean look, or a full border that is only 1px thick and very low contrast. Labels sit above the field in wide-tracked Montserrat caps.
- **Cards**: Backgrounds are slightly different from the main surface (e.g., Surface: Off-White, Card: Bone). No shadows; use a subtle 1px border or tonal difference for definition.
- **Chips/Tags**: Small, 8px rounded pill shapes with light Bone backgrounds and Charcoal text, used for workout categories or intensity levels.
- **The 'W' Mark**: The geometric logo should appear as a recurring motif—as a favicon, a loading state, or a subtle watermark in the corner of training videos.
- **Progress Bars**: Razor-thin tracks in Stone with the active progress highlighted in Muted Sage. No rounded end-caps on the progress bar to maintain the geometric architectural feel.