# Bolt 2.5 Plan — Design Foundation & Theming

*Branch:* `bolt/2-5-design-foundation`
*Depends on:* Bolt 2 (Customer Management) — merged to `main`

## Why "2.5"?

Bolt 2.5 is an **inserted Bolt** sitting between feature Bolts 2 and 3. The `.5` numbering is intentional and serves the methodology audit trail:

- The original 6-Bolt roadmap in `docs/scope.md` is preserved unchanged.
- Bolt 2.5 is a **non-feature Bolt** — it adds zero endpoints, zero domain entities, zero new pages, and zero new business rules. It only changes how existing pages look and feel, plus a thin theming infrastructure layer.
- Numbering it `2.5` rather than renumbering Bolts 3–6 to "Bolts 4–7" makes the insertion visible in the metrics tracker and case study, and lets readers map the scope doc 1:1 to the original commitment.
- This Bolt is itself a methodology talking point: in a Sprint-based world, "drop in a polish sprint mid-project" is disruptive. In AI-DLC, an outcome-defined Bolt that touches no business logic is cheap to insert without rebaselining the rest.

## Intent (Bolt-level)

Give the application a coherent visual language and a working light/dark theme toggle, so that the next person who clones the repo and runs the app sees a polished product surface — not raw PrimeNG defaults. Establish the design system foundation that Bolt 3 (Order + Prescription Entry) and Bolt 3.5 (per-page UX polish) will build on without rework.

## Scope

### In scope

- **Design tokens** — color, spacing, typography, radius, shadow scales defined as CSS custom properties in a single `src/styles/tokens.css` (or similar single source of truth)
- **PrimeNG theme integration** — choose a PrimeNG 17+ theme (Aura family preferred for native dark-mode support) and wire it through `angular.json` styles array
- **Theme service** — `ThemeService` exposing a signal for current mode, an `init()` that reads `localStorage` then falls back to `prefers-color-scheme`, and a `toggle()` that flips, persists, and applies the dark class on `<html>`
- **Theme toggle UI** — visible, keyboard-accessible toggle in the top nav (sun/moon icon, smooth transition)
- **Layout shell redesign** — real top nav with brand mark, role-aware nav items, user dropdown (logout + theme toggle); page container with consistent max-width and padding; footer with project name + small "AI-DLC case study" link
- **Login screen redesign** — full-height centered card, brand mark above the form, helpful microcopy, consistent token usage, decent empty/error states
- **Customers list restyle** — page header with title + "Add Customer" button on right, table card with proper border and shadow, polished empty state, action buttons styled consistently
- **Accessibility floor** — WCAG AA contrast on both themes for primary text/background, all interactive elements keyboard-reachable, focus rings visible
- **Visual regression evidence** — before/after screenshots of login + customers page in both themes, saved to `docs/screenshots/bolt-2.5/` for the case study

### Out of scope (explicit non-goals)

- New pages, routes, or features → not a feature Bolt
- Backend changes of any kind → frontend-only Bolt
- Per-page polish for screens that don't yet exist (Orders, Receipts, Dashboard) → those pages get polish in their own feature Bolts or a final Bolt 3.5
- Animations beyond simple theme-transition fade and PrimeNG defaults → polish, not flourish
- Custom illustrations / icon set → use PrimeIcons + Lucide if needed
- Brand identity work (real logo, real name, marketing copy) → placeholder OK; project is a portfolio piece, not a launched product
- Full design-system documentation site → tokens are documented inline in CSS comments and in this plan

## Domain Model Delta

**None.** This is a frontend-only Bolt. No Prisma schema changes, no migrations, no new modules on the backend. If Mob Construction proposes any backend touch, that's a scope-creep signal and should be deferred.

## Gate Evidence Checklist

Write this checklist into the PR description. Bolt 2.5 is not merged until every box is checked.

### Theming infrastructure

- [ ] PrimeNG theme installed (Aura preferred) and wired in `angular.json`
- [ ] `src/styles/tokens.css` exists with documented color, spacing, typography, radius, shadow scales for both light and dark modes
- [ ] `ThemeService` exists, exposes a `signal<'light' | 'dark'>`, persists choice to `localStorage` under a stable key (e.g. `osms.theme`)
- [ ] On first load, `ThemeService.init()` reads `localStorage`, falls back to `window.matchMedia('(prefers-color-scheme: dark)')`, and applies the result before first paint (no flash of wrong theme)
- [ ] `<html>` element gets `class="dark"` toggled on/off correctly when theme switches

### Layout shell

- [ ] Top nav renders on every authenticated route with: brand mark (left), role-aware nav items (middle), user dropdown with logout + theme toggle (right)
- [ ] Theme toggle is a button with sun/moon icon, has a visible focus ring, and is keyboard-operable (Enter/Space)
- [ ] Page container has a sensible max-width (e.g. 1200px) and consistent horizontal padding
- [ ] Footer renders with project name and a small "AI-DLC case study" link to the README on GitHub
- [ ] Layout uses tokens — no hardcoded hex colors, no magic-number paddings outside `tokens.css`

### Login screen

- [ ] Full-height centered card layout
- [ ] Brand mark visible above the form
- [ ] Microcopy under the heading (e.g. "Sign in to manage your shop")
- [ ] Form uses tokens for spacing, color, radius
- [ ] Error message uses semantic red token, not hardcoded color
- [ ] Looks intentional in both light and dark mode

### Customers list page

- [ ] Page header with title on left, "Add Customer" button on right
- [ ] Table is wrapped in a card with proper border + shadow tokens
- [ ] Empty state renders when no customers exist (icon + message + CTA)
- [ ] Search input uses token spacing and is visually integrated with the table card
- [ ] Action buttons (edit / delete) are styled consistently and aligned right in the row
- [ ] Looks intentional in both light and dark mode

### Accessibility

- [ ] All primary text / background pairs meet WCAG AA (4.5:1) on both themes — verified via Lighthouse or browser dev-tools contrast picker
- [ ] All interactive elements are keyboard-reachable (Tab through login → nav → toggle → table → actions)
- [ ] Visible focus rings on all interactive elements (no `outline: none` without a replacement)
- [ ] Theme toggle button has an `aria-label` describing the action ("Switch to dark mode" / "Switch to light mode")

### Visual regression evidence

- [ ] `docs/screenshots/bolt-2.5/` contains: `login-light.png`, `login-dark.png`, `customers-light.png`, `customers-dark.png`
- [ ] Same screenshots referenced in the Bolt 2.5 retro and (optionally) embedded in the LinkedIn post

### Build & integrity

- [ ] `ng build` completes with zero errors and zero new warnings
- [ ] `wc -l` and `tail` spot-check on every modified file confirms no truncation (process change carried from Bolt 2 retro)
- [ ] No console errors on any screen in either theme
- [ ] No regressions: Bolt 2 e2e tests still pass (`npm run test:e2e` from `optical-backend/`)

## Implementation Plan

### Frontend steps (in order)

1. **Pick theme + install** — choose PrimeNG Aura (or equivalent that supports class-based dark mode); install via `npm` if a different bundle is needed; wire stylesheet imports in `angular.json` (or `styles.css` `@import`).
2. **Create `src/styles/tokens.css`** — define `:root` light values and `:root.dark` overrides for the full token set (color, spacing, typography, radius, shadow). Document each scale with a short comment.
3. **Create `ThemeService`** — signal-based, `init()` + `toggle()` + `current()`. Provided in root.
4. **Wire theme initialization** — call `ThemeService.init()` at app bootstrap (in `app.config.ts` provider factory or `APP_INITIALIZER`) to apply the class before first paint.
5. **Build the layout shell** — refactor existing `layout.component` to: top nav (brand left, nav middle, user dropdown right), `<router-outlet>` inside a max-width container, footer at the bottom. Add the theme toggle button to the user dropdown (or directly in the nav). Use tokens throughout.
6. **Redesign login screen** — refactor `login.component` to a centered-card layout with brand mark above and microcopy. Replace any hardcoded styles with token references.
7. **Restyle customers list** — wrap the existing PrimeNG table in a card, add a page header with title + Add button, add an empty-state component, polish the action column. No logic changes.
8. **Verify accessibility** — run Lighthouse Accessibility audit on `/login` and `/customers` in both themes; fix any contrast or focus-ring issues; add `aria-label` to the theme toggle.
9. **Capture screenshots** — run `ng serve`, capture both themes for both pages, save to `docs/screenshots/bolt-2.5/`.
10. **Run regression** — `ng build` clean, `npm run test:e2e` from backend still green, no console errors.

### Testing approach

- No new automated tests required — design changes are visually verified.
- Existing Bolt 2 e2e tests must still pass (no logic changes should break them).
- Add the Lighthouse Accessibility score to the retro as a Gate Evidence supporting metric.
- Optionally: add a single Cypress or Playwright "smoke" test that loads `/customers`, takes a screenshot in each theme, and asserts no console errors. Defer to Bolt 3 if scoping feels tight.

## Estimated Effort

| Phase | Estimate |
|---|---|
| Mob Elaboration (resolve open questions, confirm token palette) | 5 min |
| Theming infrastructure (tokens, ThemeService, init) | 10–15 min |
| Layout shell refactor | 15–20 min |
| Login redesign | 5–10 min |
| Customers list restyle | 10–15 min |
| Accessibility pass + fixes | 5–10 min |
| Screenshots + Gate Evidence walk-through | 5 min |
| Retro + metrics update | 5 min |
| **Total** | **60–85 min** |

A traditional estimate for the same scope: ~10–14 hours (custom design system + theme service + theme toggle wiring + layout shell rework + login redesign + table page restyle + accessibility pass + cross-theme verification).

## Risks and Open Questions

Resolve in the first 2 minutes of Mob Elaboration, before any code is written:

- **PrimeNG theme bundle choice.** Aura is the modern PrimeNG 17+ theme with first-class dark mode via `:root.dark` selector. Lara is the previous generation with separate light/dark CSS files (requires runtime swap). **Plan: Aura.** Confirm or reject.
- **Token color palette — what's the primary?** Optical shops sit somewhere between healthcare and retail. Options: indigo (trustworthy, professional), teal (medical-adjacent, fresh), warm amber (premium retail). **Plan: indigo primary with neutral grays and standard semantic green/amber/red.** Confirm or override.
- **Brand mark — what is it for now?** Real logo work is out of scope. Options: (a) text wordmark "Optical Shop" in a custom-tracked font, (b) a single PrimeIcon (e.g. `pi-eye` or `pi-shopping-cart`) + text, (c) a tiny inline SVG glyph. **Plan: PrimeIcon `pi-eye` next to text "Optical Shop".** Cheap, recognizable, replaceable later.
- **Theme persistence key.** **Plan: `localStorage['osms.theme']`** holding `"light"` or `"dark"`. Namespacing prevents collision if anyone runs the app on a shared dev domain.
- **First-paint flash prevention.** With Angular SPA bootstrap, the theme class is applied during `APP_INITIALIZER` — already after first paint. Acceptable for MVP since the flash is sub-100ms on warm load. **Plan: accept the minor flash; defer SSR-style flicker prevention to post-MVP.**
- **Where does the theme toggle live?** Options: (a) inside the user-dropdown menu, (b) as a standalone icon button next to the user dropdown, (c) only on the login screen and inside the dashboard. **Plan: standalone icon button next to the user dropdown (option b)** — discoverable, one click away on every authenticated page, also visible on the login screen.

## What Changes vs Bolt 2 (Process)

Per the Bolt 2 retro, three new process rules apply from Bolt 2.5 onward:

1. ☐ `ng build` is a Gate Evidence item, run **after** any tests, before declaring the Bolt done — catches source-on-disk corruption that warm dev servers hide.
2. ☐ File-integrity spot check (`wc -l` + `tail`) on every modified file before merge — Bolt 2 lost 14 lines of `auth.service.ts` to a silent truncation; we don't repeat that.
3. ☐ Walk the implementation-plan numbered steps explicitly during the walk-through — don't rely on the Bolt summary's deviation table to catch everything.

Plus one specific to design Bolts:

4. ☐ Capture before/after screenshots in both themes and store under `docs/screenshots/bolt-2.5/`. Visual changes need visual evidence; the metrics tracker alone can't prove "looks polished."

## Success Criteria

When all of the following are true, Bolt 2.5 is done:

- The Gate Evidence checklist above is fully ticked in the PR description.
- A new visitor cloning the repo, running `ng serve`, and clicking through `/login → /customers` in both themes would describe the app as "polished" rather than "raw PrimeNG."
- A recruiter or engineer who clicks the LinkedIn post #1 link, lands on the README, and runs the demo locally does not have their AI-DLC productivity claim undercut by what they see on screen.
- Bolt 3's UI work (Orders + Prescription forms, customer detail tabs) can use `tokens.css` and the layout shell directly — no rework, no parallel design system.
