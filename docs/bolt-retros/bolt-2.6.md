# Bolt 2.6 Retro — Visual Identity & Motion Design

*Type:* Inserted (non-feature) Bolt sitting between Bolts 2.5 and 3
*Duration:* ~1.23 hours total — 0.80 (~48 min) main run + 0.25 (~15 min) Patch 1 + 0.18 (~11 min) Patch 2
*Branch:* `bolt/2-6-visual-identity`
*Sessions:* 3 single-prompt Mob Construction runs (1 main + 2 patches), with one in-session "make it simple" course-correct on Patch 2
*PR:* (to be opened on push)

## What Shipped

- **Geist + Geist Mono typography** wired through Angular's stylesheet pipeline via the official `geist` npm package (the `@vercel/geist-font` recommendation in the original plan was a hallucinated package — replaced by the model with `geist` mid-construction; deviation noted)
- **Brand-gradient + glow tokens** added to `tokens.css`: `--brand-gradient`, `--shadow-glow-primary`, animation easing curves, expanded type scale (32–40px H1, `-0.02em` heading tracking, 1.6 body line-height)
- **Animated brand-mark component** replaces the static `pi-eye` — outer ring expands ~10%, inner pupil dot scales down ~30%, brief gradient sweep across the iris on hover (~250ms ease-out)
- **Glassmorphic top nav** — `backdrop-filter: blur(12px)` over an indigo-tinted translucent surface (rgba(18,18,52,0.78)); page content scrolling under the nav is visibly blurred
- **Gradient-mesh login background** — two soft indigo/violet glows positioned with `inset: -10%`, opacity 0.42/0.32, animated via `transform: translate()` drift (deviation from the plan's `background-position` approach — superior because GPU-accelerated, no paint trigger)
- **Login CTA gradient sweep** — primary button uses a 4-stop horizontal gradient (indigo → violet → fuchsia → indigo) with `background-size: 200% 100%` + `background-position` shift on hover, ~350ms
- **Lens-aperture focus rings** — layered double-ring focus state, 1px solid inner + 4–6px brand-gradient glow
- **Page-load reveals** — header + main content fade-up (20px → 0, 250ms ease-out, 50ms stagger) on every authenticated page
- **Card hover lift** — `transform: translateY(-2px) scale(1.005)` + deepened shadow on table card and empty-state card (200ms ease-out)
- **Route transitions** — wrapper-level fade + 8px slide via Angular Animations on `.route-wrapper`
- **Theme-toggle morph** — sun ↔ moon icon rotates 180° with opacity interpolation, 250ms
- **PrimeNG entrance overrides** — toast / dialog scale 0.95 → 1.0 + opacity 0 → 1 + translateY 8px → 0, 220ms spring-style ease-out
- **Illustrated empty state** — customers empty state replaced with a small SVG prescription card, gentle ~3s floating animation, gradient-text headline, glowing CTA
- **`prefers-reduced-motion` honoring** — animation tokens collapse to `0ms` under reduced motion (untested in browser this session — deferred)
- **Dark mode promoted to hero theme** — gradient-mesh background, gradient text fill on `<h1>`, glow on primary CTAs and focused inputs
- **Patch 1:** five visual defects (mesh flat black, CTA sweep absent, glassmorphic nav imperceptible, table card hover lift absent, customers empty on initial load) batch-fixed in 14m 53s
- **Patch 2:** NG0100 `ExpressionChangedAfterItHasBeenCheckedError` in `CustomerListComponent` resolved via `ChangeDetectionStrategy.OnPush` after a failed first attempt at `queueMicrotask` deferral

## Gate Evidence Results

| Gate | Pass / Fail | Notes |
|---|---|---|
| `ng build` compiles clean | ✅ | bundle 840.63 kB, no new warnings |
| Bolt 2 e2e regression — 14 / 14 customer tests pass | ✅ | across all 3 sessions |
| Login renders with gradient-mesh background, not flat black | ✅ | post-Patch-1 |
| Primary CTA shows visible gradient sweep on hover | ✅ | post-Patch-1 |
| Top nav reads as glassmorphic (content blurred underneath) | ✅ | post-Patch-1 (indigo-tinted surface) |
| Card hover lift is perceptible on `/customers` table card | ✅ | post-Patch-1 (animation-fill-mode fix) |
| Customers list populates on initial load | ✅ | post-Patch-2 (OnPush fix) |
| Page-load stagger fires on `/customers` | ✅ | confirmed by user |
| Route transition fade+slide visible between routes | ✅ | confirmed by user during construction |
| Brand mark animates on hover | ✅ | confirmed by user during construction |
| Geist + Geist Mono load successfully (status 200/304 in Network) | ✅ | confirmed by user |
| Lighthouse Accessibility 20/20 — `/login` light | ⏸ | **deferred** — deferred to a later visual-tuning pass; D1 was diagnosed via direct Console + Network inspection, which is the higher-trust verification channel |
| Lighthouse Accessibility 20/20 — `/login` dark | ⏸ | deferred (same rationale) |
| Lighthouse Accessibility 20/20 — `/customers` light | ⏸ | deferred (same rationale) |
| Lighthouse Accessibility 20/20 — `/customers` dark | ⏸ | deferred (same rationale) |
| Lighthouse Performance Snapshot — `/customers` | ⏸ | deferred (same rationale) |
| Anti-generic side-by-side vs vercel.com/login | ⏸ | deferred — sample screenshot to be captured before LinkedIn post #1 |
| `prefers-reduced-motion` emulation suppresses animations | ⏸ | deferred — DevTools emulation check not performed this session |

The five deferred Gate items are not blockers for merge: the Bolt's functional and visual layer was verified by direct browser inspection (the channel that actually caught both Patch 1 and Patch 2 bugs). Lighthouse + anti-generic + reduced-motion become a single mini-pass before the LinkedIn post and before Bolt 3 starts. Logged as pre-Bolt-3 deferred work.

## What AI-DLC Did Well

- **Three single-prompt sessions, zero hand-written code.** Main construction + two patches all driven by canonical kickoff prompts. The "two single-prompt sessions" pattern from Bolt 2.5 generalized cleanly to "N single-prompt sessions, one per defect class" for an aesthetics-heavy Bolt.
- **The plan's reference anchors and named animations did the work they were designed to do.** Stripe / Vercel / Linear named in the Visual Thesis section gave the model a concrete target. Ten named animations with durations, easings, and transforms specified in advance meant Mob Construction could check off measurable items, not produce "tasteful motion" handwave. This is the corrective Bolt 2.5's retro called for, and it landed.
- **Mid-construction package-recommendation self-correction.** The plan listed `@vercel/geist-font` as the font package; that name does not exist on npm. The model self-corrected to `geist` (the official Vercel package) without prompting. Worth noting because the plan asked for "whichever wires cleanly" — the open-ended phrasing absorbed the bad recommendation gracefully.
- **The patch-loop template established in Bolt 2.5 paid compound interest.** Patch 1 (5 defects) and Patch 2 (1 defect) both used the named-defect / file-path / process-rules template from Bolt 2.5's retro. Construction-to-fix on Patch 1 was 15 minutes for five P1 visual defects. The template is now a project-wide standing pattern.
- **D2 deviation (transform-translate over background-position) was an upgrade, not a slip.** The patch used GPU-accelerated `transform: translate()` for the mesh drift instead of the plan's `background-position` animation. Both produce the visual result; transform avoids a paint trigger and runs on the compositor thread. Caught in retro, not in Gate Evidence.

## Where AI-DLC Struggled

- **The "automated tests pass, user-visible behavior is broken" pattern occurred for the third consecutive Bolt.** Bolt 2 truncated `auth.service.ts` while Jest cached the full in-memory module. Bolt 2.5 left the Angular splash boilerplate in `app.html` while `ng build` reported clean. Bolt 2.6 reported "16/16 done in 48 min" while five visual defects + one functional regression were live in the browser. Three occurrences is not a coincidence; it is the dominant failure class of AI-DLC on this project. The methodology claim that earns this its place in the case study: **automated tests are not Gate Evidence for what the user sees.** The fix is structural — every frontend Bolt's Gate Evidence must include direct browser observation (DevTools Console + Network + DOM), not only build/test status.
- **Patch 1's first-attempt diagnosis of D1 was confidently wrong.** It claimed the customers-empty bug was a route-animation `:enter` race with `provideAnimationsAsync()`, applied a wrapper-level fade fix on `.route-wrapper`, and reported D1 resolved. The user re-verified and reported the spinner still stuck. The actual root cause — `NG0100: ExpressionChangedAfterItHasBeenCheckedError` in dev mode's post-check verification pass — required the user to read the actual console error and feed it back. **Lesson: a diagnosis without runtime evidence (Network tab status, Console errors, DOM state) is a guess. Patch 2's kickoff prompt was rewritten with mandatory "DevTools observation before code change" rules.**
- **`queueMicrotask` was reached for before `OnPush` was considered.** Patch 2's first-attempt fix used `queueMicrotask()` to defer the signal write past the dev-mode verification cycle. Technically valid, but a band-aid: it defers the symptom rather than fix the change-detection model. The user pushed back ("It should be a simple fix. Why we have this problem still there. ChangeStrategy should be there. Make it simple"). The architectural answer was `ChangeDetectionStrategy.OnPush` on the standalone component — the canonical modern-Angular pattern for signals + HTTP. **Lesson generalizes: when the agent reaches for `queueMicrotask`, `setTimeout(0)`, or `detectChanges()` to fix a CD bug, that is a tell that the change-detection strategy itself is the missing piece. The Bolt 3+ kickoff prompts will name OnPush explicitly as the preferred CD posture for signal-driven components.**
- **Plan estimate (165 min) vs actual main-construction time (48 min) is suspicious in the wrong direction.** The model claimed 16/16 plan steps complete in less than a third of the planned time. This is the same shape as a passing test suite that hides truncated code. It correlated 1:1 with the five visual defects + one functional regression. **Lesson: when actual construction wall-clock comes in dramatically under plan estimate, treat it as a Gate Evidence trigger — assume something was skipped, verify visually before accepting.**
- **Lighthouse + anti-generic + reduced-motion deferred to a later pass.** Pragmatic call (the pacing cost of running them now is not free, and direct browser inspection caught the actual defects), but it does mean Bolt 2.6 closed without the standing Gate Evidence item the Bolt 2.5 retro promised. Tracked as pre-Bolt-3 work. **Lesson: standing Gate Evidence items must be enforced by Definition of Done, not by retro promise — Bolt 3's plan should list Lighthouse audits as a hard merge gate, not an optional follow-up.**
- **Did not capture pre/post screenshots for the case study.** The visual transformation between Bolt 2.5 (median PrimeNG aesthetic) and Bolt 2.6 (gradient mesh + glassmorphic nav + Geist) is the most LinkedIn-postable artefact of the project so far, and the screenshots were not captured during Gate Evidence. Logged as a pre-LinkedIn-post-#1 task.

## Prompts That Worked

- **Bolt 2.6 main kickoff** — pointed at the canonical plan with all seven open questions pre-resolved, named the Visual Thesis section as required reading, listed the ten signature animations as binary check-offs. The pre-resolution pattern (Bolt 2 / Bolt 2.5) is now the project standard.
- **Patch 1 kickoff (5 defects)** — followed the Bolt 2.5 patch-loop template exactly (named defects in priority order, file paths included, process rules, required summary structure). Construction-to-fix was 15 minutes for five P1 visual defects. Template is durable.
- **Patch 2 kickoff (NG0100)** — added a new constraint to the template: **mandatory runtime browser evidence before any fix.** "Open the running app at /customers in Chrome with DevTools open. Network tab: confirm whether GET /customers fires. Console tab: check for any uncaught errors. Elements tab: inspect the DOM under the loading spinner — is the table element present but opacity:0, or is the loading flag never flipping, or is the component itself never being instantiated?" This pattern should be standing for any "user-visible behavior is broken" defect, not just NG0100 cases.

## Prompts That Failed

- **Patch 2 first-attempt prompt did not name `OnPush` as the preferred fix.** It listed acceptable patterns (queueMicrotask, allowSignalWrites, toSignal, afterNextRender) and explicitly forbade `detectChanges`/`setTimeout(0)` — but it did not list `ChangeDetectionStrategy.OnPush` first. Result: the model picked the smallest-diff fix (queueMicrotask) which technically worked but missed the architectural answer. The user's "make it simple / ChangeStrategy" course-correct in-session redirected to OnPush. **Lesson: when listing acceptable fix patterns, order them by architectural correctness, not by smallest diff. List the canonical pattern first; the model anchors on the first option.**

## Process Changes for the Next Bolt

Carrying these into Bolt 3 (Order + Prescription Entry — the marquee feature) and beyond:

- **Direct browser observation becomes standing Gate Evidence on every frontend Bolt.** Definition: open the running app, open DevTools, walk the user-visible flow, confirm Console clean + Network expected + DOM populated. Not negotiable — this is what catches the failure class that has now bitten this project three times.
- **Lighthouse 4-run a11y + 1-run Performance becomes a hard merge gate, not a retro promise.** Bolt 3's plan will list it as a checked item required to merge.
- **`ChangeDetectionStrategy.OnPush` is the default for new standalone signal-driven components.** Bolt 3+ kickoff prompts will name OnPush explicitly. Removes a class of NG0100 bugs at the source.
- **Plan-vs-actual wall-clock divergence is itself a Gate Evidence trigger.** If Bolt 3's actual construction time comes in at <50% of plan estimate, treat as suspicious. Add a "wall-clock sanity check" line to the closeout template.
- **Pre/post screenshots are part of every Bolt's deliverables, not a post-hoc afterthought.** Bolt 3 closes with screenshots into `docs/screenshots/bolt-3/`.
- **The patch-loop template now has three pieces:** (1) named defects with file paths and priorities, (2) process rules + required summary structure, (3) mandatory runtime browser evidence section. All three are required for any patch where the symptom is user-visible.
- **Order acceptable-fix lists by architectural correctness.** Canonical pattern first. The model anchors on the first option.

## Metrics Recorded

- Clock hours: **1.23** (~74 min — 48 main + 15 Patch 1 + 11 Patch 2)
- Prompts: **3** (1 main kickoff + 1 Patch 1 + 1 Patch 2 ; one in-session "make it simple" course-correct on Patch 2 was a follow-up message, not a separate construction prompt)
- LOC generated: **~? main + net changes on patches** (to be measured via `git diff --stat` on the bolt branch before merge)
- LOC hand-written: **0**
- Tests added: **0** (visual-identity / motion Bolt; runtime browser observation is Gate Evidence)
- Gate failures: **6** (5 visual defects on first construction + 1 NG0100 on first construction; both caught by direct browser observation, neither by automated tests or `ng build`)
- Production bugs found later: **0** (to be updated)
- Deferred Gate Evidence items: **5** (4 Lighthouse runs + 1 Performance run + anti-generic + reduced-motion — tracked as pre-Bolt-3 work)
- Bundle delta: **836 kB → 840.63 kB** (+~5 kB net for Geist fonts, animated brand-mark, mesh background, illustrated empty state, glassmorphic nav)

### Estimated Traditional Baseline

A senior developer-designer working manually would need roughly 25–35 hours to deliver the same Gate Evidence: ~3–4h to integrate Geist + Geist Mono cleanly across Angular's stylesheet pipeline and resolve any FOUC, ~4–6h to author the brand-gradient + glow tokens and refit existing surfaces to consume them without contrast regressions, ~6–8h on the ten signature animations (each one is a separate design + implementation pass — iris brand-mark, lens-aperture focus rings, login hero stagger, page-load reveals, card hover lift, CTA gradient sweep, route transitions, theme-toggle morph, PrimeNG entrance overrides, table-row hover), ~3–4h on the gradient-mesh background (positioning, layering, performance tuning) and the glassmorphic nav (translucent surface tuning + content visibility under blur), ~2–3h on the illustrated empty state (SVG authoring + floating animation + gradient text), ~2–3h on the `prefers-reduced-motion` honoring across all motion paths, and ~3–4h debugging the inevitable change-detection / animation / glassmorphism / gradient interactions (the equivalent of Patches 1 and 2). 25 hours is the conservative estimate; 35 is the realistic one. Actual Bolt 2.6: 1.23 hours.

Speedup: roughly **20× faster** against the conservative baseline, **~28× faster** against the realistic one.

### Caveat on the Bolt 2.6 speedup figure

The 20×–28× ratio is honest for what Bolt 2.6 actually shipped, but it sits on top of Bolt 2.5's working design system. None of the typography, color tokens, or theme-service plumbing had to be solved twice — the first hour of any traditional design re-skin was already paid for. The same dynamic that compressed Bolt 2's ratio (a clean DDD skeleton from Bolt 1) compresses Bolt 2.6's ratio: aesthetics-heavy work piled on a working foundation is the upper-bound case for AI-DLC speedup. Bolt 3 (Order + Prescription Entry) is the first Bolt with novel domain logic — handwritten-card-to-database translation, prescription field modeling, payment lifecycle — and is where the speedup will compress not because AI-DLC slows down but because the traditional baseline becomes faster. Treat the Bolt 2.6 ratio as "AI-DLC delivers a premium visual identity at ~20–28× when the design foundation is already in place," not as a project-wide aesthetic-work claim.

### The structural lesson Bolt 2.6 lands

Across Bolts 2, 2.5, and 2.6, the same failure class has occurred three times: **automated checks pass, user-visible behavior is broken.** Different mechanism each time (file truncation, DOM-tree boilerplate, change-detection error), same shape: the model's summary said "done," the build said "clean," the tests said "pass," and the user opened the browser and saw a defect. This is the dominant risk in AI-DLC and the case study should name it explicitly. The mitigation is direct browser observation as standing Gate Evidence — the only verification channel that sees what the user sees.
