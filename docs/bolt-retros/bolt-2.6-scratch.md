# Bolt 2.6 Scratch Log

| # | Prompt / Event | Quality | Notes |
|---|---|---|---|
| 1 | Full Bolt 2.6 kickoff prompt — 16-step plan, 7 mob-elaboration decisions, process rules, branch, summary format | good | Single kickoff, self-contained, Mob Elaboration pre-resolved, all 7 decisions accepted, matches Bolt 2/2.5 pattern |
| 2 | `@vercel/geist-font` 404 — correct package name is `geist` | ok | Plan had wrong npm package name; `geist` is the official Vercel font package. Deviation accepted: same font, same outcome. |
| 3 | `login.component.scss` exceeded 4 kB anyComponentStyle budget | ok | Fixed by moving `.theme-icons` to global styles.scss (shared utility). Both login and layout de-duplicated. |
| 4 | Angular Animations easing string with CSS custom property (`var(--ease-out-soft, ease-out)`) | ok | Changed to hardcoded `cubic-bezier(0.16, 1, 0.3, 1)` to avoid Angular animation string parser ambiguity. |
| 5 | Post-bolt Patch 1 — 5 visual defects (route animation race, mesh opacity, CTA sweep, nav blur, hover lift) | ok | Route animation `:enter` race diagnosis was wrong — actual cause was NG0100 in CustomerListComponent (see prompt 6). Other 4 CSS defects fixed correctly. |
| 6 | Post-bolt Patch 2 — NG0100 D1 fix attempt 1 | bad | `queueMicrotask()` not patched by Zone.js in Angular 21; write happened but no CD triggered; spinner stuck until user click. Reverted. |
| 7 | Post-bolt Patch 2 — D1 fix attempt 2 | bad | `afterNextRender` executes outside NgZone by design. HTTP request started from outside zone; response callbacks also ran outside zone; Zone.js never called `checkStable()`; no CD triggered. Same symptom as attempt 1. |
| 8 | Post-bolt Patch 2 — D1 fix attempt 3 | good | `afterNextRender(() => ngZone.run(() => loadCustomers()))` — `ngZone.run()` switches back into the Angular zone before calling `loadCustomers`, so the HTTP request and its response callbacks are zone-tracked, CD fires on response. Zero new warnings, 14/14 e2e pass. |

## Build result
- Zero errors, zero NEW warnings
- Pre-existing `bundle initial` warning (840.66 kB vs. 836 kB Bolt 2.5 baseline, +4.66 kB)
- 14/14 Bolt 2 e2e customer tests pass
- 1 pre-existing failure: AppController e2e "Hello World" (Bolt 1 hygiene gap #2, documented in Bolt 2.5 retro)

## Post-bolt patch — Prompt 5 (5-defect fix)
| # | Defect | Root cause | Fix |
|---|---|---|---|
| D1 | Customers list empty on load (P0) | `group()+query(':enter')` sets entering component to `opacity:0`; `provideAnimationsAsync()` race can leave it there | Replace with wrapper-level animation: `style({opacity:0})→animate→style({opacity:1})` on `.route-wrapper` div |
| D2 | Gradient mesh flat black in dark mode (P1) | `background-size:200%200%` positions both gradient centers off-screen simultaneously; opacity 0.18 too low | `inset:-10%` on mesh element; switch to `transform`-based `mesh-drift` keyframe; opacity raised to 0.42/0.32 |
| D3 | CTA gradient sweep invisible (P1) | `135deg` diagonal gradient doesn't visually sweep horizontally; start/end colors too similar | Change to `to right` with 4 distinct stops: `#4f46e5→#7c3aed→#d946ef→#4f46e5` |
| D4 | Nav glassmorphism invisible (P1) | Dark `--surface-glass: rgba(10,10,20,0.65)` nearly identical to `#0a0a0f` page bg; blur imperceptible | `--surface-glass: rgba(18,18,52,0.78)` in dark mode (indigo tint); nav `border-bottom: rgba(99,102,241,0.22)` |
| D5 | Table card hover lift blocked (P1) | `.customers-page>*` stagger uses `animation-fill-mode:both`; `forwards` fill keeps `transform` under animation control after fade-up ends, blocking CSS transitions | Change to `animation-fill-mode:backwards` (holds "from" before delay, releases after completion) |

### Patch build result
- Zero errors, zero NEW warnings
- 840.63 kB (–0.03 kB vs 840.66 kB Bolt 2.6 pre-patch; group/query removal trimmed bytes)
- 14/14 Bolt 2 e2e customer tests pass
- 1 pre-existing failure: AppController "Hello World" (unchanged)

### Modified files (patch)
- `layout.component.ts` — 52→46 lines (removed group/query/comment)
- `login.component.scss` — mesh inset/opacity/gradient direction
- `styles.scss` — mesh-drift keyframe: background-position→transform
- `tokens.css` — dark --surface-glass with indigo tint
- `layout.component.scss` — nav border-bottom indigo
- `customer-list.component.scss` — animation-fill-mode both→backwards

## Manual gate evidence required
- [ ] Lighthouse Accessibility 20/20 (zero contrast failures) — /login + /customers, both themes
- [ ] Lighthouse Performance ≥ 85 on /login
- [ ] Anti-generic check: /login dark mode side-by-side with Stripe/Vercel
- [ ] Screenshots: login-dark.png, login-light.png, customers-dark.png, customers-light.png, customers-empty-dark.png
