# Bolt 2.6 Plan — Visual Identity & Motion Design

*Branch:* `bolt/2-6-visual-identity`
*Depends on:* Bolt 2.5 (Design Foundation & Theming) — merged to `main`

## Why "2.6"?

Bolt 2.5 shipped real foundation: design tokens, theme service, dark/light, layout shell, accessibility floor. None of that is being thrown out. Bolt 2.6 is **additive** — it rewrites the *visual surface* (typography, color treatments, motion, signature moments) without touching the foundation underneath.

The methodology lesson behind this Bolt is itself a case-study artefact and feeds the Bolt 2.5 retro:

> **Bolt 2.5's Gate Evidence checked for "polished" and "WCAG AA" but had no item for "aesthetic ambition." All boxes ticked, output was generic. The fix isn't to abandon AI-DLC — it's to write Gate Evidence that fails when the output is generic.**

This plan is the response to that lesson. Every Gate Evidence item below is written to **fail visually** if the result drifts back toward median PrimeNG-default web-app aesthetic.

## Intent (Bolt-level)

Give the application a distinctive visual identity that reads as *"premium SaaS / dev-tool product"* (Stripe, Vercel, Linear-tier) rather than *"generic Angular admin template."* Bake in generous, performant motion as a core part of the brand. Establish one or two signature moments tied to the optical metaphor (subtle eye/lens nods) so the app is memorable on a 5-second scroll past in a LinkedIn feed.

## The Visual Thesis (the most important section — read twice)

**Reference anchors.** When an aesthetic decision is ambiguous during construction, look at these specific products and pick the answer closest to them:

- **Stripe Dashboard** (sign-in screen, dashboard nav, table cards) — *primary anchor*
- **Vercel Dashboard** (project list, settings pages, dark-mode-first feel) — *primary anchor*
- **Linear** (typography rhythm, focus rings, micro-interactions) — *secondary anchor*

The app should feel like it could be a sub-page of any of those products. Not a clone — a peer.

**Color treatment.**

- **Brand gradient:** `linear-gradient(135deg, indigo-500, violet-500, fuchsia-500)` — used sparingly, as the signature accent. Appears on: brand-mark glyph, primary CTA hover sweep, page-header title (`<h1>`) text fill in dark mode, login-screen background mesh.
- **Dark mode is the hero theme.** It must look more impressive than light mode. This inverts the Bolt 2.5 thinking. The LinkedIn screenshots will be dark-mode.
- **Backgrounds:** dark mode uses near-black with a subtle radial gradient mesh (`#0a0a0f` base, with two soft indigo/violet glows positioned off-screen). Light mode uses near-white with a faint gradient overlay only on hero surfaces (login).
- **Glow:** primary CTAs and focused inputs have a soft `box-shadow` glow in the brand-gradient color, not a flat ring.
- **No flat blue PrimeNG defaults anywhere.** If you see a flat indigo button with no gradient, glow, or interaction state, it's wrong.

**Typography.**

- **Font family:** **Geist** (body) + **Geist Mono** (numerals, IDs, dates, `createdAt` columns). Free via Google Fonts or `@vercel/geist-font` package. This is Vercel's house font — distinctive, premium, instantly readable as "modern SaaS."
- **Type scale:** larger H1 than Bolt 2.5 (32–40px), tighter letter-spacing on headings (`-0.02em`), generous line-height on body (1.6).
- **Page-header titles use a gradient text fill** in dark mode (`background-clip: text` with the brand gradient). Subtle. Only h1.

**Glassmorphism (used surgically).**

- **Top nav:** `backdrop-filter: blur(12px)` over a translucent dark surface. The page content scrolling under the nav must be visible-but-blurred.
- **Modal / dialog backdrops:** dimmed + slightly blurred overlay.
- **Empty state cards:** very subtle frost over the gradient-mesh background.
- **Nowhere else.** Glassmorphism is a moment, not a texture.

**Signature animations (named, specified, verifiable).**

1. **Iris brand-mark hover.** The `pi-eye` brand mark transforms on hover into an animated iris/aperture: outer ring expands ~10%, an inner pupil dot scales down ~30%, a brief gradient sweep across the iris. ~250ms, ease-out. Implemented in pure CSS or a small inline SVG.
2. **Lens-aperture focus rings.** Replace the standard browser/PrimeNG focus ring with a layered double-ring: 1px solid inner ring in primary color + soft 4–6px glow in the brand gradient. Reads as "looking through a lens."
3. **Login hero animation.** On `/login` mount: gradient-mesh background fades in over 600ms; brand-mark glyph scales up with iris reveal (0.95 → 1.0, ~400ms); headline + microcopy stagger-fade-up (40px → 0, 60ms stagger between heading, sub, form). Total below the fold: ≤ 800ms.
4. **Page-load reveals.** Every authenticated page: header + main content blocks fade-up (20px → 0, 250ms ease-out, 50ms stagger). Use Angular Animations or CSS keyframes triggered on route enter.
5. **Card hover lift.** Cards (table card, empty-state card, dialog card) lift on hover: `transform: translateY(-2px) scale(1.005)`, shadow deepens, optional subtle gradient border edge. 200ms ease-out.
6. **Primary CTA gradient sweep.** Primary buttons have a `linear-gradient` background with a `background-position` animation on hover that slides the gradient ~50% in 350ms.
7. **Route transitions.** Smooth fade + 8px slide between routes (~200ms each direction). Implemented via Angular `@trigger`.
8. **Theme toggle micro.** When toggling theme: the icon rotates 180° as it morphs from sun → moon (or vice versa) with the `transform` and `opacity` interpolated. 250ms.
9. **Toast / dialog entrance.** Override PrimeNG defaults with a custom spring-style ease-out: scale 0.95 → 1.0 + opacity 0 → 1 + translateY 8px → 0. 220ms.
10. **Table row hover.** Row hover bg shifts subtly + adds a thin gradient indicator on the left edge (4px wide). 150ms.

**Empty state as a moment.** The customers empty state currently has an icon + message. Bolt 2.6 turns it into a small illustrated card: a simple SVG of an empty prescription card with a subtle floating animation (~3s gentle bobbing), the headline in gradient text, the CTA button as a glowing primary CTA. Sets the bar for how empty states feel across the rest of the app.

**Anti-generic checks (these are Gate Evidence items below).** If any of these are *not true*, the Bolt has drifted back to median:

- A first-time visitor screenshots `/login` in dark mode and the screenshot looks like it could appear in a "modern SaaS UI" inspiration board.
- The brand mark hover animation is the kind of detail you'd point to in a portfolio review.
- Page transitions are visible and feel intentional, not "page swaps to next page with no transition."
- The dark-mode background is not flat black — there's depth from the gradient mesh.
- A primary CTA looks like a Stripe / Vercel button, not a flat PrimeNG button.

## Scope

### In scope

- Geist + Geist Mono font integration (Google Fonts or `@vercel/geist-font` — pick whichever wires cleanly with Angular's stylesheet pipeline)
- Token additions: brand gradient, glow shadows, animation easing curves, type-scale upgrades, glassmorphism surface tokens
- Animated brand-mark component (replaces the static `pi-eye`)
- Lens-aperture focus-ring utility (global CSS, applied via `:focus-visible`)
- Glassmorphic top-nav refactor
- Login screen: gradient-mesh background, hero animation, glowing CTA, gradient text on heading
- Customers page: page-header gradient text, lifted table card, illustrated empty state, gradient row-hover indicator, animated action icons
- Route transitions via Angular Animations
- Theme-toggle morph animation
- Custom toast / dialog entrance overrides
- All ten signature animations from the thesis above

### Out of scope (explicit non-goals)

- New pages, routes, or features → not a feature Bolt
- Backend changes of any kind → frontend-only Bolt
- Custom cursors / parallax / scroll-jacking → "Showy" was rejected; we're at "Generous"
- Heavy 3D / WebGL / canvas illustration → Geist + SVG is enough
- Replacing PrimeNG components wholesale → keep the components Bolt 2.5 chose to keep; restyle their surfaces only
- Mobile-first responsive overhaul → MVP target is desktop optical-shop owners; mobile polish is a later Bolt
- Internationalization, RTL → not now

## Domain Model Delta

**None.** Frontend-only Bolt. No Prisma schema changes, no migrations, no new modules on the backend. If Mob Construction proposes any backend touch, that's a scope-creep signal and should be deferred.

## Gate Evidence Checklist

Write this checklist into the PR description. Bolt 2.6 is not merged until every box is checked. Items are written to fail visually when the result is generic.

### Typography & token additions

- [ ] Geist + Geist Mono fonts loaded and applied as `--font-sans` and `--font-mono`. Verified by inspecting computed `font-family` in DevTools — the rendered font name resolves to `Geist`, not `system-ui`.
- [ ] Token additions present in `tokens.css`: `--gradient-brand` (135deg indigo→violet→fuchsia), `--glow-primary`, `--glow-focus`, `--ease-spring`, `--ease-out-soft`, `--surface-glass`, `--blur-glass`.
- [ ] Type scale upgraded: `--font-h1` ≥ 32px, `--letter-spacing-tight` = `-0.02em`, `--line-height-body` = 1.6.

### Brand mark

- [ ] Brand mark replaced with an animated SVG iris/eye component. Static state shows an outer ring + inner pupil. Hover state animates the iris (outer ring scales ~110%, inner pupil scales ~70%, gradient sweep across the iris). ~250ms ease-out.
- [ ] Animation is keyboard-triggerable via `:focus-visible` (not just `:hover`) — accessible parity.
- [ ] No layout shift on hover (transforms only, no width/height changes).

### Focus rings

- [ ] All interactive elements (`button`, `a`, `input`, `[tabindex]`) get the lens-aperture focus ring on `:focus-visible`. Verified by tabbing through `/login` and `/customers` — every focus ring is the new layered ring, not a default browser outline.
- [ ] Standard browser outlines are not visible anywhere (replaced cleanly, not just hidden).
- [ ] Contrast ratio of focus ring meets WCAG AA against both light and dark backgrounds.

### Top nav

- [ ] Top nav uses `backdrop-filter: blur(12px)` (or token `--blur-glass`). Verified by scrolling content under the nav and seeing it blur through.
- [ ] Nav background is translucent (token `--surface-glass`), not opaque.
- [ ] Nav is sticky / fixed to top.
- [ ] Active nav item shows a gradient indicator (underline, glow, or pill) — not a flat color background.

### Login screen

- [ ] Background is a gradient mesh — at least two soft radial gradients positioned off-screen, animated subtly (slow `background-position` shift over 8–12s, infinite). Not a solid color, not a single linear gradient.
- [ ] On page mount, brand mark + headline + microcopy stagger-fade-up. Total animation ≤ 800ms.
- [ ] Heading uses gradient text fill (`background-clip: text`) in dark mode.
- [ ] Primary CTA has a brand-gradient background and a sweep animation on hover.
- [ ] Login card uses glassmorphism (translucent + blurred) over the gradient mesh.
- [ ] Looks intentional in both themes.

### Customers page

- [ ] Page-header `<h1>` uses gradient text fill.
- [ ] Search input on focus shows the lens-aperture glow.
- [ ] Table card lifts on hover (`translateY(-2px)`, shadow deepens, gradient edge on the active side). 200ms ease.
- [ ] Table row hover shows a 4px gradient indicator on the left edge.
- [ ] Empty state is the illustrated version: SVG prescription-card glyph with subtle 3s floating animation, gradient-text headline, glowing CTA button.
- [ ] Action icons (edit, delete) animate subtly on hover (e.g., pencil icon nudges, trash icon shakes ~5°).

### Motion & transitions

- [ ] Route transitions exist: fade + 8px slide between routes. Tested by clicking between Login → Dashboard → Customers and back.
- [ ] Page-load stagger reveals on every authenticated page (header + content blocks fade-up with stagger).
- [ ] Theme-toggle icon rotates and morphs (sun ↔ moon) over ~250ms when toggled.
- [ ] Toast / dialog entrance uses the custom spring ease (scale + opacity + translateY). PrimeNG defaults are overridden, not used as-is.
- [ ] Card and button hover states have transitions (no instant color flips anywhere).

### Anti-generic visual checks

- [ ] Stripe / Vercel comparison: open `/login` in dark mode side-by-side with `dashboard.stripe.com` or `vercel.com/login`. The aesthetic should read as "same family of design," not "Stripe's polished login next to a different category of UI."
- [ ] Generic-PrimeNG comparison: load any default PrimeNG demo. The Bolt 2.6 UI must read as visually distinct — different in typography, color treatment, motion, and surface treatment. If the difference is only "slightly different shade of blue," it has failed.
- [ ] Recruiter screenshot test: take a screenshot of `/login` in dark mode. Imagine it on a LinkedIn post in someone's feed. Does it pause the scroll? Yes / no.

### Build, accessibility, regression

- [ ] `ng build` completes with zero errors and zero new warnings.
- [ ] Lighthouse Accessibility ≥ 95 on `/login` and `/customers` in both themes (no regression from Bolt 2.5).
- [ ] Lighthouse Performance ≥ 85 on `/login` (animations must not tank perf — confirm `prefers-reduced-motion` disables non-essential animations).
- [ ] `prefers-reduced-motion: reduce` is honored — gradient mesh stops animating, page-load reveals collapse to instant, route transitions reduce to fade-only.
- [ ] All Bolt 2 e2e tests still pass (`npm run test:e2e` from `optical-backend/`).
- [ ] File-integrity spot check (`wc -l` + `tail`) on every modified file confirms no truncation.

### Visual regression evidence

- [ ] `docs/screenshots/bolt-2.6/` contains:
  - [ ] `login-dark.png` (the hero shot for LinkedIn)
  - [ ] `login-light.png`
  - [ ] `customers-dark.png` (with at least one row + the lifted card)
  - [ ] `customers-light.png`
  - [ ] `customers-empty-dark.png` (the illustrated empty state)
  - [ ] `brand-mark-hover.gif` (a 1-second loop of the iris animation) — optional but high-value for the LinkedIn post

## Implementation Plan

### Frontend steps (in order)

1. **Add Geist fonts.** Install `@vercel/geist-font` (or load Geist + Geist Mono from Google Fonts). Wire into `angular.json` + `styles.scss`. Set `--font-sans` and `--font-mono` tokens.
2. **Extend `tokens.css`.** Add: `--gradient-brand`, `--glow-primary`, `--glow-focus`, `--ease-spring`, `--ease-out-soft`, `--surface-glass`, `--blur-glass`, `--font-h1` ≥ 32px, `--letter-spacing-tight`, `--line-height-body`. Document each.
3. **Create `<brand-mark>` component.** Self-contained SVG component with hover/focus iris animation. Use only CSS transforms and gradient fills (no JS animation library).
4. **Add the lens-aperture focus-ring utility.** Global `:focus-visible` selector with the layered shadow. Replace any local focus styles that conflict.
5. **Refactor top nav for glassmorphism.** Sticky positioning, `backdrop-filter: blur`, translucent surface, gradient active-item indicator. Keep current nav structure — only restyle.
6. **Refactor `/login` into the hero.** Gradient-mesh background (animated), brand-mark center, gradient-text headline, glassmorphic card, glowing primary CTA with sweep, stagger entrance animations.
7. **Refactor `/customers` page header + table card.** Gradient title, lifted table card on hover, gradient row-hover indicator, animated action icons.
8. **Replace the empty state.** Inline SVG prescription-card glyph + floating animation + gradient headline + glowing CTA.
9. **Add route transitions.** Angular Animations `@trigger` on `<router-outlet>`. Fade + 8px slide.
10. **Add page-load stagger reveals.** Either Angular Animations on each page component or a shared CSS `@keyframes` + `animation-delay` on direct children.
11. **Add theme-toggle morph animation.** Replace the binary icon swap with a transform-and-fade between sun and moon.
12. **Override PrimeNG toast / dialog entrance.** Target the relevant CSS classes with custom keyframes.
13. **Add `prefers-reduced-motion` overrides.** Wrap all non-essential animations in `@media (prefers-reduced-motion: no-preference)`. Provide reduced fallbacks.
14. **Lighthouse run + a11y verification.** Both themes, both pages.
15. **Capture screenshots + optional brand-mark hover GIF.**
16. **Final regression.** `ng build`, `npm run test:e2e`, file-integrity check, console clean check.

### Testing approach

- No new automated tests required — the Bolt is visual.
- All Bolt 2 e2e tests must still pass (no logic regressions).
- Lighthouse Performance and Accessibility scores are Gate Evidence supporting metrics.
- Optional stretch: a single Cypress visual-regression test that mounts `/login` in dark mode and asserts no console errors. Defer to Bolt 3 if scope is tight.

## Estimated Effort

| Phase | Estimate |
|---|---|
| Mob Elaboration (re-confirm thesis, lock font choice, lock gradient palette) | 5 min |
| Token additions + Geist integration | 15 min |
| Brand-mark animated component | 20 min |
| Focus-ring utility + glassmorphic nav | 15 min |
| Login hero refactor (gradient mesh, hero animation, glassmorphic card) | 30 min |
| Customers page restyle (gradient title, lifted card, gradient row hover, illustrated empty state, animated icons) | 30 min |
| Route transitions + page-load stagger reveals | 15 min |
| Theme-toggle morph + toast/dialog entrance overrides | 10 min |
| `prefers-reduced-motion` overrides | 5 min |
| Anti-generic visual checks + Lighthouse + screenshots + GIF | 15 min |
| Retro + metrics update | 5 min |
| **Total** | **~165 min (≈ 2 hours 45 min)** |

A traditional estimate for the same scope: ~25–35 hours (custom font integration + token additions + animated brand-mark SVG + custom focus-ring system + glassmorphic nav + hero login refactor with mesh gradient + customers page restyle + route transitions + page-load stagger system + theme-toggle morph + PrimeNG override CSS + reduced-motion accessibility + cross-theme verification + visual regression evidence).

## Risks and Open Questions

Resolve in the first 2 minutes of Mob Elaboration, before any code is written:

- **Font delivery: `@vercel/geist-font` package vs Google Fonts CDN.** Package gives offline + version-pinned fonts; CDN is one line to set up. **Recommended: `@vercel/geist-font` (`npm install @vercel/geist-font`)** — version-pinned, no FOUT, smaller delivery footprint than Google Fonts script tag. Confirm or override.
- **SVG brand mark: hand-written vs PrimeIcons-derived.** Hand-written gives full control over the iris animation; PrimeIcons are stuck. **Recommended: hand-written 24×24 SVG `<brand-mark>` component** with two concentric circles + a clipped gradient fill. Confirm.
- **Gradient mesh implementation: pure CSS radial gradients vs lightweight library (e.g. `mesh-gradient.js`).** Pure CSS is enough for two soft radial blobs. **Recommended: pure CSS, two `radial-gradient` layers + a slow `background-position` animation.** Confirm.
- **Route transitions: Angular Animations API vs CSS-only via View Transitions API.** Angular Animations is well-documented, works in all browsers. View Transitions API is sleeker but Chromium-only. **Recommended: Angular Animations API** for compatibility. Confirm.
- **Empty-state illustration: hand-drawn SVG vs sourced (e.g. unDraw, IconScout).** Hand-drawn keeps brand cohesion. **Recommended: hand-drawn 240×160 SVG of a stylized prescription card** with a subtle gradient stroke + a single magnifying-glass overlay. Confirm.
- **Geist Mono usage scope.** Where is mono actually used? **Recommended:** `createdAt` column values, customer IDs in URL/breadcrumb, any timestamps. Confirm.
- **Reduced-motion fallback strictness.** Should the gradient-mesh background animation stop entirely under `prefers-reduced-motion: reduce`, or just slow down? **Recommended: stop entirely.** Confirm.

## What Changes vs Bolt 2.5 (Process)

The Bolt 2.5 retro will catalogue this lesson explicitly:

> **Aesthetic ambition needs concrete reference points and visually-failing Gate Evidence.** "Looks polished" is not a verifiable criterion; "looks like it could be a sub-page of Stripe Dashboard" is. From Bolt 2.6 onward, any Bolt with visual surface area must include reference anchors and at least one anti-generic Gate Evidence item that fails when the result drifts back to median.

Process rules carried into Bolt 2.6:

1. ☐ `ng build` is a Gate Evidence item, run **after** any tests, before declaring the Bolt done.
2. ☐ File-integrity spot check (`wc -l` + `tail`) on every modified file before merge.
3. ☐ Walk the implementation-plan numbered steps explicitly during the walk-through.
4. ☐ Capture before/after screenshots in both themes and store under `docs/screenshots/bolt-2.6/`.
5. **NEW:** ☐ Anti-generic check is in Gate Evidence. The Bolt fails if the side-by-side with Stripe/Vercel doesn't read as "same design family."
6. **NEW:** ☐ Reference anchors are named in the plan (Stripe Dashboard, Vercel Dashboard, Linear) — not "look at modern SaaS." Vague references produce vague output.

## Success Criteria

When all of the following are true, Bolt 2.6 is done:

- The Gate Evidence checklist above is fully ticked in the PR description.
- A side-by-side screenshot of `/login` in dark mode next to a Stripe or Vercel sign-in screen reads as "same design family" — not "different categories of product."
- A recruiter or engineer who clicks the LinkedIn post link, lands on the running app, and screenshots `/login` would feel comfortable putting that screenshot on a "modern SaaS UI inspiration" board.
- The brand-mark iris hover animation is the kind of detail you'd point to in a portfolio review without prompting.
- Bolt 3 (Order + Prescription Entry) inherits the visual language with no rework — page header gradient, table card style, focus rings, route transitions all just work for the new pages.
- The dark-mode screenshots are the ones we use for LinkedIn post #1.
