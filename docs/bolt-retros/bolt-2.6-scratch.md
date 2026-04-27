# Bolt 2.6 Scratch Log

| # | Prompt / Event | Quality | Notes |
|---|---|---|---|
| 1 | Full Bolt 2.6 kickoff prompt — 16-step plan, 7 mob-elaboration decisions, process rules, branch, summary format | good | Single kickoff, self-contained, Mob Elaboration pre-resolved, all 7 decisions accepted, matches Bolt 2/2.5 pattern |
| 2 | `@vercel/geist-font` 404 — correct package name is `geist` | ok | Plan had wrong npm package name; `geist` is the official Vercel font package. Deviation accepted: same font, same outcome. |
| 3 | `login.component.scss` exceeded 4 kB anyComponentStyle budget | ok | Fixed by moving `.theme-icons` to global styles.scss (shared utility). Both login and layout de-duplicated. |
| 4 | Angular Animations easing string with CSS custom property (`var(--ease-out-soft, ease-out)`) | ok | Changed to hardcoded `cubic-bezier(0.16, 1, 0.3, 1)` to avoid Angular animation string parser ambiguity. |

## Build result
- Zero errors, zero NEW warnings
- Pre-existing `bundle initial` warning (840.66 kB vs. 836 kB Bolt 2.5 baseline, +4.66 kB)
- 14/14 Bolt 2 e2e customer tests pass
- 1 pre-existing failure: AppController e2e "Hello World" (Bolt 1 hygiene gap #2, documented in Bolt 2.5 retro)

## Manual gate evidence required
- [ ] Lighthouse Accessibility 20/20 (zero contrast failures) — /login + /customers, both themes
- [ ] Lighthouse Performance ≥ 85 on /login
- [ ] Anti-generic check: /login dark mode side-by-side with Stripe/Vercel
- [ ] Screenshots: login-dark.png, login-light.png, customers-dark.png, customers-light.png, customers-empty-dark.png
