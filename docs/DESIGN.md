---
name: Wolfitness Design System
colors:
  surface: '#f4fbf4'
  surface-dim: '#d4dcd5'
  surface-bright: '#f4fbf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef6ee'
  surface-container: '#e8f0e9'
  surface-container-high: '#e3eae3'
  surface-container-highest: '#dde4dd'
  on-surface: '#161d19'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#2b322d'
  inverse-on-surface: '#ebf3eb'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#5f5e5c'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2de'
  on-secondary-container: '#656461'
  tertiary: '#a43a3a'
  on-tertiary: '#ffffff'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#e5e2de'
  secondary-fixed-dim: '#c8c6c3'
  on-secondary-fixed: '#1c1c1a'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#f4fbf4'
  on-background: '#161d19'
  surface-variant: '#dde4dd'
typography:
  display-lg:
    fontFamily: Archivo Narrow
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 48px
  max-width: 1200px
---

## Brand & Style
The design system embodies the intersection of high-performance athletics and luxury fashion editorial. The personality is disciplined yet serene, moving away from the aggressive neon aesthetics of traditional fitness apps toward a "quiet luxury" approach. 

The style utilizes **Layered Glassmorphism** to create a sense of depth and physical space. By using frosted surfaces over soft off-white backgrounds, the interface feels lightweight and breathable. Generous whitespace is treated as a premium commodity, ensuring that content—whether high-resolution photography or performance metrics—is given center stage. The emotional response is one of calm focus, high-end exclusivity, and modern sophistication.

## Colors
This palette is anchored in high-contrast neutrals with a singular, sophisticated accent. 

- **Surfaces (#FBF9F8):** Use this soft off-white for the primary background of all views to provide a warmer, more premium feel than pure white.
- **Containers (#FFFFFF):** Elevated cards and modules use pure white to distinguish themselves from the base surface.
- **Typography (#1C1C1A):** A deep graphite used for all primary text, providing a softer but equally legible alternative to pure black.
- **Performance Highlights (#10B981):** This muted emerald is used sparingly for progress rings, achievement states, and primary action buttons. It signifies growth and vitality without being jarring.

## Typography
The typography strategy creates a tension between athletic energy and editorial refinement.

- **Headlines:** Use **Archivo Narrow** in bold weights. The condensed, uppercase nature evokes vintage stopwatch displays and premium athletic apparel branding. Use generous tracking (letter spacing) for smaller headers to maintain a luxury feel.
- **Body & Supporting Text:** Use **Manrope** for its clean, geometric, and modern characteristics. It provides a technical but human balance to the aggressive headers.
- **Hierarchy:** Maintain extreme contrast between header sizes and body text. Large display type should be used for key metrics (e.g., heart rate, minutes) to create a bold, "magazine cover" layout style.

## Layout & Spacing
The layout follows a **Fixed Grid** approach for desktop/tablet and a **Fluid Content** model for mobile, emphasizing verticality and rhythm.

- **Editorial Rhythm:** Instead of standard padding, use oversized margins (24px or 32px) to frame content. Group related items closely but leave significant gaps (48px+) between major sections to allow the user's eye to rest.
- **Mobile:** Use a 4-column grid with 24px side margins. Elements should favor full-bleed edges for photography but inset cards for metrics.
- **Desktop:** Center-aligned 12-column grid. Use asymmetrical layouts (e.g., a large image spanning 7 columns with text spanning 4 columns) to mimic high-end fitness magazine spreads.

## Elevation & Depth
Depth is communicated through light and transparency rather than heavy shadows.

- **Tier 1 (Base):** Soft off-white (#FBF9F8).
- **Tier 2 (Glass):** Floating elements like navigation bars and metric overlays use a backdrop-blur (20px) with 70% white opacity. This creates a "frosted glass" effect that feels airy.
- **Tier 3 (Floating):** Primary cards use pure white (#FFFFFF) with a very large, soft shadow: `0px 20px 40px rgba(28, 28, 26, 0.04)`. The shadow should be barely perceptible, serving to lift the card subtly rather than create a dark glow.
- **Interactive:** Upon interaction, increase the shadow spread and slightly scale the element (1.02x) to simulate physical lift.

## Shapes
The shape language is controlled and sophisticated. 

Avoid "bubbly" aesthetics. While the system uses **Rounded (0.5rem)** corners for standard UI components, container elements (cards) should use **rounded-xl (1.5rem)** to create a sense of softness. Buttons and input fields should remain consistent with a medium radius to maintain a professional, architectural feel. For high-impact imagery, consider using subtle "squircle" masks or architectural aspect ratios (3:4 or 16:9).

## Components
Consistent application of these rules ensures a premium experience:

- **Buttons:** Primary buttons use Graphite (#1C1C1A) with White text for high-contrast impact. Secondary buttons use the Emerald (#10B981) accent for specific positive actions like "Start Workout."
- **Glass Cards:** Use for non-interactive data displays or overlays. Always include a 1px white border at 50% opacity to define the edge of the glass.
- **Input Fields:** Minimalist design with only a bottom border or a very subtle soft-gray container. Labels should always be in `label-sm` (uppercase) above the field.
- **Progress Indicators:** Use thin stroke weights for rings and bars. Use the Emerald accent against a very light gray track to maintain elegance.
- **Lists:** High whitespace between rows. Use Graphite for primary titles and a lighter gray for secondary metadata. No dividers; use whitespace to separate items.
- **Chips:** Small, uppercase `label-sm` text inside a pill-shaped container with a 1px border. Use for tags like "Strength," "Yoga," or "Elite."