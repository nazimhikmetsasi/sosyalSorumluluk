---
name: GıdaKöprüsü
colors:
  surface: '#e8fff0'
  surface-dim: '#b8e4cc'
  surface-bright: '#e8fff0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#d1fee5'
  surface-container: '#ccf8df'
  surface-container-high: '#c6f2da'
  surface-container-highest: '#c1ecd4'
  on-surface: '#002114'
  on-surface-variant: '#404943'
  inverse-surface: '#0e3727'
  inverse-on-surface: '#cffbe2'
  outline: '#707973'
  outline-variant: '#bfc9c1'
  surface-tint: '#2c694e'
  primary: '#0f5238'
  on-primary: '#ffffff'
  primary-container: '#2d6a4f'
  on-primary-container: '#a8e7c5'
  inverse-primary: '#95d4b3'
  secondary: '#006c48'
  on-secondary: '#ffffff'
  secondary-container: '#92f7c3'
  on-secondary-container: '#00734d'
  tertiary: '#0d5237'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c6a4e'
  on-tertiary-container: '#a7e7c4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f0ce'
  primary-fixed-dim: '#95d4b3'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#0e5138'
  secondary-fixed: '#92f7c3'
  secondary-fixed-dim: '#75daa8'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#b0f1cc'
  tertiary-fixed-dim: '#94d4b1'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#0c5136'
  background: '#e8fff0'
  on-background: '#002114'
  surface-variant: '#c1ecd4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: '0'
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: '0'
  title-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes a trustworthy, ecologically conscious, and clean aesthetic designed for food surplus redistribution and supply logistics. Balancing organic vitality with utilitarian precision, the visual language merges modern minimalism with subtle tactile warmth. The interface avoids dense clutter, using generous white space and soft tonal contrast to project safety, freshness, and transparency.

The target demographic includes commercial food donors, logistical coordinators, and recipient organizations needing instantaneous visibility into distribution pipelines. The visual tone must elicit confidence, ethical purpose, and operational ease. Key design tenets include:
- **Luminosity and Breathability:** Light backgrounds complemented by high-legibility typographic hierarchies.
- **Organic Professionalism:** Forest and mint green tones balanced by systematic structural alignments.
- **Clarity of Purpose:** Uncluttered layouts utilizing horizontal-first navigation patterns rather than restrictive sidebars.

## Colors
The color hierarchy is anchored around deep natural greens and crisp surfaces, fostering a sustainable yet dependable tone.

### Palette Architecture
- **Primary (`#2D6A4F`):** Anchors primary actions, authoritative headlines, active tab indicators, and essential navigation states.
- **Secondary (`#52B788`):** Applied to supporting iconography, active progression states, success badges, and secondary micro-interactions.
- **Accent / Tertiary (`#95D5B2`):** Reserved for hover fills, interactive wash states, pill selections, and informational highlight backdrops.
- **Neutral Dark (`#1B4332`):** Primary copy tone providing higher visual richness and softer contrast than stark pitch black.
- **Neutral Muted (`#6B7280`):** Secondary metadata, inactive borders, labels, and contextual helpers.
- **Canvas & Surface:**
  - Base Body Canvas: `#FFFFFF`
  - Subtle Section Canvas: `#F0FFF4` (soft mint wash for container contrast and section delineation)
  - Surface Containers: `#FFFFFF`

### Semantic Roles
- **Success:** `#10B981` (Completed transfers, verified donor status)
- **Warning:** `#F59E0B` (Perishable expiry alerts, pending approvals)
- **Error:** `#EF4444` (Critical collection windows, logistical disruptions, form validation errors)

## Typography
Inter delivers clarity and spatial economy across dense inventory sheets, donation forms, and real-time transit dashboards.

- **Headlines and Titles:** Rendered exclusively with `700` weight (or `600` at smaller title grades) using negative tracking (`-0.01em` to `-0.02em`) to ground structural hierarchy and command attention with crisp authority.
- **Body Copy:** Standardized at `400` weight with comfortable line heights (`1.5` to `1.6`) to minimize reading fatigue in analytical or text-heavy screens.
- **Labels, Badges, and Metrics:** Standardized at `500` and `600` weights to retain optical weight when set against soft backgrounds or pill shapes.

## Layout & Spacing
The layout follows a fluid 12-column grid constrained to a maximum content container width of `1280px` on desktop viewports. The interface relies on horizontal visual flow, eliminating persistent sidebars to grant maximum screen breadth to tabular data, logistics feeds, and dispatch matrices.

### Breakpoints & Fluid Adaptation
- **Desktop (1024px and above):** 12 columns, `1.5rem` (`24px`) gutters, and an outer margin of `2rem` (`32px`). Navigation is anchored in an elevated horizontal top bar (`72px` fixed height) featuring inline tabs and global utility controls.
- **Tablet (768px – 1023px):** 8 columns, `1.25rem` (`20px`) gutters, and `1.5rem` (`24px`) outer margin. Navigation items condense into priority tabs with secondary flows placed inside an overflow drawer.
- **Mobile (below 768px):** 4 columns, `1rem` (`16px`) gutters, and `1rem` (`16px`) canvas margin. The horizontal navigation condenses into a clean header with a persistent bottom-sheet utility or an app-like bottom tab bar.

## Elevation & Depth
Depth is created through subtle, natural ambient light rather than artificial dark drops. Shadows carry an olive-green chromatic tint (`rgba(27, 67, 50, ...)`) rather than sterile neutral black, providing an organic feel.

- **Level 0 (Flat):** Base canvas surfaces, inline cards within grouped lists, and secondary table containers. Outlined by `1px solid rgba(27, 67, 50, 0.08)`.
- **Level 1 (`shadow-sm`):** Standard data cards, summary panels, and input fields.
  - Shadow configuration: `0 1px 3px 0 rgba(27, 67, 50, 0.05), 0 1px 2px -1px rgba(27, 67, 50, 0.05)`
  - Edge outline: `1px solid rgba(27, 67, 50, 0.06)`
- **Level 2 (`shadow-md`):** Hover states of interactive cards, dropdown menus, horizontal navbar base, and modal actions.
  - Shadow configuration: `0 4px 6px -1px rgba(27, 67, 50, 0.07), 0 2px 4px -2px rgba(27, 67, 50, 0.05)`
- **Top Navigation Elevation:** The horizontal top bar rests at sticky layer elevation utilizing background blur (`backdrop-filter: blur(12px)`) combined with a background of `rgba(255, 255, 255, 0.92)` and a soft bottom border delimiter of `1px solid rgba(45, 106, 79, 0.08)`.

## Shapes
A unified radius hierarchy provides a tactile, rounded presentation without appearing overly playful:

- **Cards and Major Containers:** Fixed at `16px` (`1rem`) border radius, establishing soft content zones.
- **Buttons and Primary Interactive Elements:** Fixed at `12px` (`0.75rem`) border radius, striking a balance between clickable tangibility and modern structure.
- **Input Fields, Dropdowns, and Form Elements:** Fixed at `10px` (`0.625rem`) border radius for ergonomic data entry.
- **Chips, Badges, and Status Indicators:** Rendered as full pills (`9999px`) to visually differentiate metadata from actionable rectangular triggers.

## Components

### Top Navigation Bar (Horizontal Navbar)
- **Height & Behavior:** `72px` height, pinned to the top of the viewport with a sticky index.
- **Layout:** Logo and branding on the far left, centralized horizontal menu items, profile and notifications grouped on the far right.
- **Item States:**
  - Default: `#1B4332` with transparent background, `14px` weight `500`.
  - Hover: Text shifts to `#2D6A4F`, background gains a subtle pill-shaped wash of `rgba(149, 213, 178, 0.2)`.
  - Active: Text `#2D6A4F`, weight `600`, with a bottom active indicator (`3px` line, `#2D6A4F` with `3px` top border radius) or a soft pill enclosure (`#F0FFF4`).

### Buttons
- **Primary Button:** `#2D6A4F` background with `#FFFFFF` text. Radius: `12px`. Hover transitions to `#1B4332`. Padding: `10px 20px` for standard height (`44px`).
- **Secondary Button:** Surface background (`#FFFFFF`) with a `1.5px` border of `#2D6A4F` and `#2D6A4F` text. Hover: `#F0FFF4` background.
- **Ghost/Tertiary:** Transparent background, `#2D6A4F` text. Hover: `rgba(149, 213, 178, 0.25)` fill. Radius: `10px`.

### Cards & Information Containers
- **Visual Style:** `#FFFFFF` background, `16px` border radius, `shadow-sm`, and `1px` subtle border of `rgba(27, 67, 50, 0.06)`.
- **Inner Padding:** `20px` or `24px` (`space-lg`).
- **Accent Cards (Featured / Progress):** Background shifts to `#F0FFF4` with a `#52B788` interior accent border or micro-accent tag.

### Form Inputs & Text Fields
- **Container:** Height `42px`, `10px` border radius, `#FFFFFF` background.
- **Border:** `1px solid #D1D5DB` in neutral state, transitions to `1.5px solid #2D6A4F` on focus with a faint glow (`0 0 0 3px rgba(82, 183, 136, 0.2))`.
- **Text & Placeholder:** Text set in `#1B4332`, placeholder in `#6B7280`.

### Badges, Status Pills & Chips
- **Geometry:** Height `24px` to `28px`, full pill radius (`9999px`), horizontal padding `10px`.
- **Donation Active / Fresh:** Background `#F0FFF4`, text `#2D6A4F`, dot indicator `#52B788`.
- **Expiring Soon / Warning:** Background `#FEF3C7`, text `#B45309`, dot indicator `#F59E0B`.
- **Depleted / Urgent:** Background `#FEE2E2`, text `#B91C1C`, dot indicator `#EF4444`.

### Checkboxes & Radio Controls
- **Geometry:** Checkboxes have `6px` radius; radio controls are circular.
- **Selected State:** Solid `#2D6A4F` fill with crisp white icon checkmark. Unselected: `1.5px solid #D1D5DB` with white interior.

### Logistics Progress Bar
- **Track:** Height `8px`, border radius `9999px`, background `rgba(45, 106, 79, 0.1)`.
- **Indicator Fill:** Solid `#52B788` or smooth linear transition between `#52B788` and `#2D6A4F`.