# Bolt 2.5 Retro — Design Foundation & Theming

*Type:* Inserted (non-feature) Bolt sitting between Bolts 2 and 3
*Duration:* 0.72 hours total — 0.58 (~35 min) main run + 0.13 (~8 min) post-Bolt patch
*Branch:* `bolt/2-5-design-foundation`
*Sessions:* 2 single-prompt Claude Code runs (1 main + 1 patch)
*PR:* (to be opened on push)

## What Shipped

- Design-token system in `src/styles/tokens.css` — 100+ CSS custom properties spanning surfaces, text, accents, borders, elevation, and motion, with full light + dark variants under `:root` and `.dark`
- Signal-based `ThemeService` (`src/app/core/theme/theme.service.ts`) — `osms.theme` localStorage persistence, `prefers-color-scheme` fallback, runtime `light` / `dark` / `system` modes, FOUC prevention via `APP_INITIALIZER`
- PrimeNG Aura wiring updated to use `darkModeSelector: '.dark'` so the entire component library follows the theme service without manual overrides
- Layout shell (`src/app/layout/layout.component.*`) — header with brand mark, role badge, nav, theme toggle button; footer with attribution
- Login page redesigned to consume tokens (gradient hero panel, branded sign-in card, theme toggle accessible without authentication)
- Customers page redesigned to consume tokens (token-aware DataTable, dialogs, toasts, role-gated controls)
- pi-eye brand mark + "Laser Optical" wordmark integrated into nav and login hero
- Theme toggle wired into the nav (icon-only button that morphs sun ↔ moon)
- Screenshots folder structure (`docs/screenshots/bolt-2.5/`) with the four manual-a11y-verification captures (login + customers × light + dark)
- **Post-Bolt patch:** removed leftover Angular splash boilerplate from `app.html` (343 → 1 line); removed orphaned `title` signal from `app.ts`; added `header="Confirm Delete"` to `<p-confirmdialog>`; added dark-mode `.login-btn` text-color override to push the button above WCAG AA contrast (≈2.98:1 → ≈6.6:1)

## Gate Evidence Results

| Gate | Pass / Fail | Notes |
|---|---|---|
| `tokens.css` defines all required token categories in both themes | ✅ | surfaces, text, accents, borders, elevation, motion |
| `ThemeService` toggles `.dark` on `<html>` and persists to `osms.theme` | ✅ | verified in DevTools application storage |
| FOUC prevention via `APP_INITIALIZER` | ✅ | initial paint matches stored or system preference |
| PrimeNG components follow theme without manual overrides | ✅ | `darkModeSelector: '.dark'` on Aura |
| `ng build` compiles clean | ✅ | one pre-existing budget warning, slightly smaller post-patch |
| Bolt 2 e2e regression — 14 / 14 customer tests pass | ✅ | both main and patch sessions |
| File-integrity check (`wc -l`, `tail`) on every modified file | ✅ | post-patch only — see "What AI-DLC Struggled" |
| Lighthouse Accessibility ≥ 95 — `/login` light | ⚠️ → ✅ | failed pre-patch (boilerplate-driven contrast); 19/20 post-patch |
| Lighthouse Accessibility ≥ 95 — `/login` dark | ⚠️ → ✅ | failed pre-patch (button text 2.98:1 contrast); 19/20 post-patch |
| Lighthouse Accessibility ≥ 95 — `/customers` light | ⚠️ → ✅ | failed pre-patch (`p-confirmdialog` no name + boilerplate); 20/21 post-patch |
| Lighthouse Accessibility ≥ 95 — `/customers` dark | ⚠️ → ✅ | failed pre-patch (same reasons); 20/21 post-patch |
| Manual UI walk-through — theme toggle on login (no auth) | ✅ | toggle reachable without sign-in |
| Manual UI walk-through — theme persists across reload | ✅ | localStorage round-trip verified |
| Manual UI walk-through — system preference change updates UI | ✅ | when mode set to `system` |

## What AI-DLC Did Well

- **Two single-prompt sessions, zero hand-written code.** Main run drove Mob Elaboration + Mob Construction from one kickoff. Patch session — the cleanup mandated by the manual Lighthouse audit — also single-prompt, fully specified, zero follow-ups. The pattern from Bolt 2 (pre-write the plan, single kickoff drives the whole thing) replicated cleanly on a non-feature Bolt.
- **Plan-driven Mob Elaboration was effectively zero-cost again.** The six "Open Questions" in `bolt-2.5.md` (Aura theme, indigo palette, brand mark, localStorage key, FOUC tolerance, toggle placement) were resolved by reading the plan; no Elaboration round-trip needed.
- **Manual Gate Evidence caught a real defect.** The Lighthouse audit was added to the plan specifically because automated tests cannot judge contrast or DOM hygiene. It worked — within the first audit run it surfaced (a) the Bolt 1 Angular splash boilerplate that had been silently shipping for two Bolts, (b) a missing accessible name on the customers ConfirmDialog, and (c) a borderline-failing primary-button contrast in dark mode. None of these would have been caught by `ng build` or by the 14 e2e tests.
- **The patch loop was disciplined.** From Lighthouse error → diagnosis → kickoff prompt → patch landed with passing build + tests took ~25 minutes including audit re-runs. This is the right shape for "small, named defect lists with file-level scope" — a template that should keep getting used.
- **Bundle size dropped as a byproduct of cleanup.** 854 kB → 836 kB (~18 kB) from removing the Angular logo SVG and pill styles. Removing dead scaffolding has a measurable performance benefit, not just an aesthetic one — worth flagging in the case study.

## Where AI-DLC Struggled

- **Bolt 1 hygiene gap survived two Bolts.** The default Angular splash from `ng new` (`<h1>Hello, optical-frontend</h1>`, "Congratulations! Your app is running 🎉", six pill links to angular.dev, GitHub/X/YouTube social icons) was still in `app.html`, with `<router-outlet />` appended at the bottom. Every page in the app had been rendering the Angular welcome screen above the route content since Bolt 1. It survived Bolt 2 because the boilerplate sits below the fold and the manual walk-throughs checked above-fold behavior. It survived Bolt 2.5's first construction pass because the LOC counter explicitly excluded boilerplate, so the model treated `app.html` as "already populated" and never opened it. **Lighthouse caught it because axe walks the full DOM including offscreen content.** A senior developer eyeballing the screen might also have missed it — this is the case for automated a11y audits as Gate Evidence on every Bolt that touches the frontend, not just design Bolts.
- **A second hygiene gap is still open.** The NestJS `AppController (e2e) > / (GET) expecting "Hello World!"` test has been silently failing since Bolt 1 — the backend equivalent of the Angular splash. Logged here as **Bolt 1 hygiene gap #2** for the pre-Bolt-3 cleanup patch.
- **The plan asked for an accessibility floor, not an aesthetic ceiling.** Bolt 2.5's Gate Evidence verified contrast, focus rings, theme persistence, and that the design system worked. It did not verify that the result was *good*. The first-pass output was competent — light/dark theming, tokenized colors, working brand mark — but generic. The user's reaction was "it looks like a normal looking website with nothing new in it." This is not a Bolt 2.5 failure; it is a *Bolt 2.5 plan-quality* failure. Plans that ask only for "≥95 Lighthouse" produce median visual output because the model has no anchor point for what "extraordinary" looks like. Bolt 2.6 is the corrective: its plan names reference anchors (Stripe Dashboard, Vercel Dashboard, Linear) and ten specific signature animations with concrete specs (durations, easings, transforms). The lesson generalizes: **any Bolt with an aesthetic dimension needs reference anchors named in the plan, plus an anti-generic Gate Evidence item that fails when the output drifts to median.**
- **Residual contrast deferred, not fixed.** All four Lighthouse runs cleared the ≥95 gate but each retained a single Contrast audit failure on a primary CTA. The pragmatic call was to defer rather than patch a third time, because Bolt 2.6 redesigns every primary CTA from scratch (gradient sweeps, brand-mark hovers, lens-aperture focus rings) and any contrast tweak today would be thrown away in a week. Tracked as input to Bolt 2.6's Gate Evidence (which raises the bar to 20/20 — zero contrast failures).
- **Did not enumerate the failing element on each Lighthouse run.** Should have captured the specific selector for each of the four contrast failures into the retro at the time of the audit. This would have given Bolt 2.6 a tighter target list. To be added during Bolt 2.6's pre-flight assessment when the buttons get redesigned anyway.

## Prompts That Worked

The Bolt 2.5 main kickoff worked because it pointed at the canonical plan with full Gate Evidence and resolved the six open questions with explicit accept-as-is permission, mirroring the Bolt 2 pattern. (Kickoff text in `docs/bolt-plans/bolt-2.5.md`'s "Kickoff prompt" section.)

The patch kickoff worked even better — three named defects, file paths included, explicit "do not run Lighthouse yourself" boundary so the model didn't try to fake the manual gate. Single-summary requirement at the end made post-patch verification straightforward. Worth promoting to a template for any future "post-Gate-Evidence cleanup" patches:

```
Apply a small post-Bolt patch on branch <branch>.

CONTEXT
=======
<one paragraph: what shipped, what gate revealed, what we are NOT doing>

THE THREE DEFECTS (in priority order)
=====================================
DEFECT 1 — <name>
File: <exact path>
<one paragraph: what is wrong, why>
Required fix: <exact specification, ideally with code>

DEFECT 2 — <name>
…

DEFECT 3 — <name>
…

PROCESS RULES
=============
1. No mob elaboration — defects are fully specified above.
2. Build verification: <exact commands>
3. Regression test: <exact commands>
4. File-integrity check: <wc -l + tail commands>
5. Do NOT <whatever the user is doing manually>
6. Log each prompt to <scratch>.

REQUIRED SUMMARY
================
<exact structure>
```

This is the right shape for any patch where defects are enumerated and scoped — it suppresses the model's tendency to "while I'm here, also fix…" drift.

## Prompts That Failed

No prompt failed. The single Gate failure (Lighthouse) was caused by a *plan gap*, not a *prompt gap*: the Bolt 2.5 plan did not include "remove leftover scaffolding from `ng new`" as a Bolt 1 closeout item, and there was no Gate Evidence item that would have surfaced it before the manual a11y audit. The corrective is at the plan level (and now feeds Bolt 2.6 + the Bolt 1 hygiene patch).

## Process Changes for the Next Bolt

Carrying these into Bolt 2.6 (Visual Identity & Motion Design) and beyond:

- **Lighthouse Accessibility audits become standing Gate Evidence on every frontend-touching Bolt** — not just design Bolts. Bolt 2.5 demonstrated that automated tests cannot catch DOM hygiene defects; Lighthouse can. Bolt 3+ plans should include the four-run a11y audit (key pages × light + dark) as an explicit Gate Evidence item.
- **Bolt 2.6 raises the Lighthouse Accessibility bar to 20/20 (zero contrast failures).** Carrying ≥95 forward would let the residual contrast issues from Bolt 2.5 escape into the case study. Bolt 2.6's full primary-CTA redesign needs a clean a11y profile.
- **Add an "anti-generic" Gate Evidence item to any Bolt with aesthetic dimension.** Concrete: side-by-side comparison against named reference anchors, plus a one-line judgment call ("would this pause a LinkedIn scroll for a senior developer?"). The point is to fail when the output is competent but median.
- **Bake a "remove `ng new` and `nest new` scaffolding" checklist into Bolt 1 from now on.** For this project, the leftover items are now logged as **Bolt 1 hygiene gap #1** (Angular splash, fixed in the Bolt 2.5 patch) and **#2** (NestJS Hello World controller + e2e test, still open). Both will be cleaned in a tiny pre-Bolt-3 hygiene patch.
- **Capture the failing-element selector on every Lighthouse audit, not just the score.** Lessons sit in the elements, not in the score. Three minutes per audit; pays off in the next design Bolt's targeted fixes.
- **The "two single-prompt sessions" pattern is now the working baseline for non-feature Bolts.** Plan + main kickoff → manual Gate Evidence → patch kickoff (if needed) → merge. This compresses non-feature Bolts to ≤45 min wall-clock and gives a clean audit trail of what each session changed.

## Metrics Recorded

- Clock hours: **0.72** (~43 min total — 0.58 main run + 0.13 post-Bolt patch)
- Prompts: **2** (1 main kickoff + 1 patch kickoff)
- LOC generated: **~905 main run; net-negative on patch** (~−335 after stripping Angular splash boilerplate, +5 lines for dark-mode contrast override and `<p-confirmdialog>` header)
- LOC hand-written: **0**
- Tests added: **0** (design-only Bolt; visual verification is Gate Evidence)
- Gate failures: **1** (Lighthouse manual a11y audit on first run revealed Bolt 1 Angular splash boilerplate leak; resolved via 8-min single-prompt patch on the same branch)
- Production bugs found later: **0** (to be updated)
- Bundle delta: **854 kB → 836 kB** (~18 kB reduction from removed splash assets)

### Estimated Traditional Baseline

A senior developer working manually would need roughly 10–14 hours to deliver the same Gate Evidence: ~2–3h for the design-token sheet with semantic indirection across surfaces/text/accents/borders/elevation in light + dark, ~2–3h for the signal-based theme service with localStorage persistence, `prefers-color-scheme` fallback, `APP_INITIALIZER` FOUC prevention, and PrimeNG Aura `darkModeSelector` wiring, ~3–4h refactoring login + customers shells off hardcoded colors and adding the theme toggle to the layout, ~1–2h for the manual a11y audit and Bolt 1 splash hygiene patch and contrast fix that Lighthouse forced, and ~1h verifying the Bolt 2 regression suite + clean `ng build`. 10 hours is the conservative estimate; 14 is the realistic one.

Actual AI-DLC: **0.72 hours** → roughly **14× faster** against the conservative baseline, **~19× faster** against the realistic one.

This figure should be read alongside the credibility caveat in the metrics tracker: the ~14×–19× ratio is honest for a *working* design system but understates one structural difference. The Bolt 2.5 plan deliberately left the *aesthetic ceiling* unspecified — it asked for an accessibility floor, not an extraordinary result — and the output landed at the median of what the model produces for an under-specified design brief. A traditional designer-developer would have pushed harder on visual identity in the same hours. Read the Bolt 2.5 ratio as "AI-DLC delivers a working design system at ~14×–19×," not "AI-DLC delivers a *finished* design at ~14×–19×." Bolt 2.6 closes the ceiling gap and is where the project's visual identity actually gets earned.
