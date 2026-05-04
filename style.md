# UI Style Guide

## Purpose
- Use the provided reference component as style inspiration only.
- Do not copy its full layout into app pages.
- Keep product pages (Dashboard, Projects, Tasks, Auth) functional-first with premium styling.

## Visual Direction
- Bold, clean, modern SaaS look.
- Strong contrast, high readability, clear status feedback.
- Rounded surfaces, light shadows, minimal noise.
- Blue-first stage background with lime accent highlights.
- Decorative accessories are allowed (floating blur orbs, rotating dial) but must stay subtle.

## Palette
- Primary blue: `#0038FF`
- Primary dark: `#0029BB`
- Accent lime: `#CCFF00`
- Background: `#F4F7FF`
- Surface: `#FFFFFF`
- Surface muted: `#F8FAFC`
- Text primary: `#0F172A`
- Text muted: `#5B6474`
- Success: `#15803D`
- Warning: `#C2410C`
- Danger: `#B91C1C`

## Typography
- Font family: `Manrope`
- Heading style: strong weight, tighter tracking for section titles
- Body style: medium weight, clear line height

## Layout Rules
- Sticky top app header for all authenticated pages.
- Max content width ~`1160px`.
- Grid-first sections with 12-16px spacing.
- Keep major cards rounded (`12px` to `16px`) and shadowed.
- Keep page-level headings bold/hero-like; keep card-internal headings neutral/dark for readability.

## Dashboard Rules
- Dashboard has a branded blue summary strip (not full hero takeover).
- KPI cards: numeric-first visual hierarchy.
- Include analytics blocks:
  - completion rate
  - due soon
  - project progress
  - recent tasks

## Form and Control Rules
- Inputs/selects must have visible focus ring.
- Buttons: clear hover/disabled states.
- Use role-aware action visibility for admin/member features.

## Status Design
- `TODO`: neutral badge
- `IN_PROGRESS`: warning badge
- `DONE`: success badge
- `Overdue`: danger card/badge treatment

## Responsiveness
- Mobile-first composition.
- Collapse side-by-side analytics into stacked cards on smaller screens.
- Maintain comfortable tap targets and spacing on mobile.
