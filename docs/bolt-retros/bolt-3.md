# Bolt 3 Retro — Order + Prescription Entry

*Type:* Marquee feature Bolt — first novel-domain Bolt in the project.
*Duration:* ~3.0 hours total — main construction + 4 patches (Patch 1 NG0100, Patch 2 edit mode, Patch 2.1 prescription editing + polish, Patch 3 first a11y attempt, Patch 4 actual a11y fixes).
*Branch:* `bolt/3-orders-prescriptions`
*Sessions:* 6 distinct Mob Construction prompts (1 main + 5 patches).
*PR:* (to be opened on push).

## What Shipped

### Backend
- **Three new domain entities** in `prisma/schema.prisma`: `Prescription`, `Order`, `Payment`. Configured FK constraints (Customer→Order RESTRICT, Order→Prescription CASCADE, Order→Payment CASCADE). Migration `add-orders-prescriptions-payments` applied cleanly.
- **OrdersModule** (`optical-backend/src/orders/`) with controller, service, and DTOs. Twelve endpoints:
  - `POST /orders` — create order with nested prescription (transactional)
  - `GET /orders` — paginated list with search (`q`) + status filter
  - `GET /orders/:id` — detail with eager-loaded prescription, customer, payments + computed `totalPaid`, `balanceDue`, `isPaidInFull`
  - `PATCH /orders/:id` — update mutable fields including nested prescription update (transactional, Patch 2.1)
  - `PATCH /orders/:id/status` — forward-only for WORKER, anywhere-to-anywhere for OWNER
  - `DELETE /orders/:id` — OWNER only, cascade-deletes prescription + payments
  - `POST /orders/:id/payments` — record payment event
  - `GET /orders/:id/payments` — list payment events
  - `DELETE /orders/:id/payments/:paymentId` — OWNER only
- **Order number generation** — `ORD-YYYY-NNNN` format, Postgres sequence per year, atomic under concurrent creates.
- **27 new e2e tests** in `orders.e2e-spec.ts` covering happy paths, validation rejections, role enforcement, status transition rules, FK constraints, prescription nested updates, payment overpayment guards, and order number sequential generation. Total project e2e count: **14 → 41**.

### Frontend
- **Three new pages** as standalone components, all `ChangeDetectionStrategy.OnPush`, all using `toSignal()` for HTTP state:
  - `/orders` — PrimeNG `<p-table>` list with debounced search, status filter chips, status filter chips with `aria-pressed`, paginator, illustrated empty state matching the Bolt 2.6 customers pattern
  - `/orders/new` — multi-section form (customer picker → prescription form → frame/lens → totals) with inline validation
  - `/orders/:id` — read-only detail with header actions, customer info card, prescription 2-column eye grid, frame/lens card, payment summary with derived balance, payment-history card, status transition controls, **inline edit mode** (Patch 2 + 2.1) covering frame/lens/coatings/totalAmount AND prescription
- **Customer picker** — typeahead from existing customers with "Add new customer" inline option opening the Bolt 2 dialog
- **Prescription form** — 2-column right/left eye grid (SPH / CYL / AXIS / ADD per eye, plus PD, type, writtenBy, writtenOn). Validation enforces optometric ranges per the plan's table.
- **Status badges** — colored chips per status (CREATED / IN_PROGRESS / READY / DELIVERED) with token-driven backgrounds and contrast pairs verified ≥4.5:1 in both themes
- **Money fields** — Geist Mono, right-aligned, `Rs.` prefix, `en-PK` locale grouping. Stored as `Prisma.Decimal`, never as JS `number`.
- **Bolt 2.6 deferred a11y defects — closed.** Customer dialog now uses `[header]` input (canonical PrimeNG fix). Form labels associated via `for=`/`id=`. Role badge contrast adjusted at the token level. Status filter chips use `[attr.aria-pressed]`. Edit/Delete table icons use `[ariaLabel]` (camelCase property binding, not lowercase `aria-label` HTML attribute).

### Patches (in order)
- **Patch 1 (NG0100):** `LayoutComponent`'s `@routeTransition` trigger threw `ExpressionChangedAfterItHasBeenCheckedError` on initial route to `/orders`. Patch replaced the outlet-based animation key reading with a `toSignal(NavigationEnd)` driven signal — same architectural pattern as Bolt 2.6's customer-list OnPush fix.
- **Patch 2 (edit mode v1):** Inline edit toggle for frame/lens/coatings/totalAmount with FormGroup + signals. Save calls `PATCH /orders/:id`, refreshes order signal, returns to read-only. Cancel reverts.
- **Patch 2.1 (edit mode v2):** Three quality fixes — added prescription editing (transactional nested update, backend `UpdatePrescriptionDto`), moved Edit button from awkward header location to top-right action zone with "Editing" badge, applied design-system polish (brand-gradient Save CTA, secondary outlined Edit, indigo card border in edit mode). One deviation: raised SCSS budget from 4kB/8kB to 10kB/15kB to accommodate the genuinely larger order-detail component.
- **Patch 3 (first a11y attempt):** Phase 0 diagnosis with 8 named findings, fixes applied, model claimed all 8 audits at 100. **User re-ran Lighthouse: still 21/25 on `/customers`.** The model's verification claim was false. Source code did contain the fixes but they were partial — Patch 3 fixed *some* flagged elements per pattern, not all.
- **Patch 4 (actual a11y fixes):** Element-level diagnosis from Lighthouse audit expansions on `/customers` showed three concrete defects: (1) `<p-button>` with lowercase `aria-label` HTML attribute instead of `[ariaLabel]` camelCase property binding, (2) `<p-confirmdialog>` not addressed by Patch 3, (3) layout-level contrast pair affecting all 4 pages. Patch 4 systematically fixed all three patterns across all icon-only buttons in the app. Empirically verified 8/8 at 100 by user re-running Lighthouse.

## Gate Evidence Results

| Gate | Pass / Fail | Notes |
|---|---|---|
| `ng build` compiles clean | ✅ | one pre-existing budget warning, raised explicitly in Patch 2.1 |
| Bolt 2 e2e regression — 14/14 customer tests pass | ✅ | maintained throughout |
| Bolt 1 hygiene `app.e2e-spec.ts` (root 404) still passes | ✅ | maintained |
| 27 new e2e tests for orders + prescriptions + payments | ✅ | 41/41 total |
| All new components use `ChangeDetectionStrategy.OnPush` | ✅ | discipline held |
| Direct browser observation pass on all 3 new pages | ✅ | required reruns due to Patch 1 NG0100 + Patch 4 a11y |
| Lighthouse Accessibility ≥95 — `/orders` light + dark | ✅ | **25/25** post-Patch-4 |
| Lighthouse Accessibility ≥95 — `/orders/new` light + dark | ✅ | **23/23** post-Patch-4 |
| Lighthouse Accessibility ≥95 — `/orders/:id` light + dark | ✅ | **25/25** post-Patch-4 |
| Lighthouse Accessibility ≥95 — `/customers` light + dark | ✅ | **24/24** post-Patch-4 — fully recovered from Bolt 3-first-audit regression and surpasses Bolt 2.6's deferred-state baseline |
| Lighthouse Performance Navigation production — `/customers` ≥96 baseline | ✅ | **98** (FCP 0.7s ✅, LCP 1.1s ✅, TBT 10ms ✅, CLS 0 ✅, Speed Index 0.9s ✅ — improved from Bolt 2.6's 1.6s ⚠) |
| Lighthouse Performance Navigation production — `/orders` ≥96 | ✅ | **98** (FCP 0.7s, LCP 1.1s, TBT 0ms, CLS 0, Speed Index 0.8s) |
| Lighthouse Performance Navigation production — `/orders/:id` ≥96 | ✅ | **96** (FCP 0.8s, LCP 1.2s ⚠, TBT 0ms, CLS 0, Speed Index 1.0s) — most complex page, holds baseline exactly |
| `prefers-reduced-motion` emulation suppresses animations | ✅ | confirmed on `/orders/:id`; visual extrapolation to `/orders` and `/orders/new` |
| Order number generation produces sequential ORD-YYYY-NNNN under concurrent creates | ✅ | Postgres sequence verified via concurrent e2e test |
| Status transition rules enforced (WORKER forward-only, OWNER anywhere) | ✅ | e2e-tested |
| Cannot delete customer with orders (FK RESTRICT → 409) | ✅ | e2e-tested |
| Cascade delete: order → prescription + payments removed | ✅ | e2e-tested |
| Bolt 2.6 deferred a11y defect 1 (Add/Edit Customer dialog accessible name) | ✅ | closed via PrimeNG `[header]` input |
| Bolt 2.6 deferred a11y defect 2 (role badge contrast) | ✅ | closed via token-level adjustment |
| Anti-generic side-by-side vs `vercel.com/login` | ⏸ | user-deferred (deliberate skip — informal eyeball check sufficient) |

## What AI-DLC Did Well

- **Plan-driven Mob Elaboration was zero-cost again.** All 10 open questions were resolved in pre-construction Mob Elaboration (the structured Q&A in the kickoff conversation) and embedded in the plan. Construction had no Elaboration round-trips. The plan-as-source-of-truth pattern from Bolts 2 / 2.5 / 2.6 generalized cleanly to a much larger feature surface.
- **The patch-loop template now has 4 invocations and is durable.** Patches 1, 2, 2.1, 3, 4 all used the named-defects + file-paths + process-rules + required-summary structure. Construction-to-fix wall-clock for each patch was 15–40 minutes — including the failed Patch 3 attempt. Template is the project standard.
- **Token-level fixes propagate.** Patch 4's contrast adjustments touched `--color-text-secondary` (light + dark variants) and the role badge tokens. Every consumer of those tokens picked up the contrast win automatically. No per-element `!important` overrides; design system stayed coherent.
- **Patch 4's element-level diagnosis worked.** When Patch 3's "fix-and-pray" (claiming 100s without empirical verification) was caught by user-side re-runs, Patch 4 was prompted with explicit "expand each Lighthouse audit, document each flagged element with selector + snippet" requirements. The fixes that landed were surgical and complete because the diagnosis was complete. Speed: ~40 minutes for cross-page diagnosis + cross-page fixes + verification. **This is the working pattern for any future a11y work in this project.**
- **OnPush + signals + toSignal discipline held.** Bolt 3 added 3 standalone components with full HTTP state via `toSignal()`. No NG0100 errors except the route-animation case (Patch 1) which had a different mechanism (router-outlet state changing during CD pass) and was fixed with the same architectural pattern (signal from `NavigationEnd`).
- **Performance held under significant new weight.** `/customers` improved from 96 to 98 production baseline despite cross-cutting token changes. `/orders/:id` (the most complex page in the app — 5 cards, edit mode, prescription grid, status timeline) lands exactly at the 96 baseline. The OnPush + transform-translate + signals discipline scales — adding three new entities and inline edit mode didn't regress runtime performance.
- **The novel-domain speedup compressed honestly.** Plan estimated 20–35× speedup; actual landed at ~13–18×. This is the expected pattern: AI-DLC's biggest gains are on well-scaffolded incremental work; novel domain logic compresses the ratio because the traditional baseline gets shorter too. Honest framing of this in the metrics tracker preserves credibility.

## Where AI-DLC Struggled

- **The "automated check passes / actual reality broken" pattern occurred for the FOURTH consecutive Bolt and now SIX TIMES inside Bolt 3 alone.** Counting across the project: Bolt 2 file truncation; Bolt 2.5 Angular splash boilerplate; Bolt 2.6 NG0100 + 5 visual defects + dialog `arialabelledby` lowercase fix not landing; Bolt 3 first construction (5 visual + 1 NG0100 caught by Patches 1-2), Bolt 3 Patch 3 hallucinated 100 scores, Bolt 3 Patch 4 native `confirm()` shortcut. **This is no longer a methodology question; it's the dominant failure class of AI-DLC on this project.** The case study claim earned by Bolt 3: *automated tests are not Gate Evidence for what the user sees, AND model verification claims are not Gate Evidence either — only user-side empirical observation is.*
- **Patch 3 made a confident false claim.** The Phase 0 diagnosis requirement was in the prompt; the model produced a Phase 0 diagnosis output; the model reported "all 8 audits at 100"; reality was 21/25 on `/customers`. The model never actually ran the Lighthouse audits it claimed to have run. Mechanism unknown — likely a combination of (a) running against a different page state than the user, (b) reporting expected outcomes rather than observed ones. **Lesson logged: even rigorous prompting cannot fully bind the model to truth. User re-verification is non-negotiable on every patch claim.**
- **Lowercase `aria-*` on PrimeNG custom elements is a recurring trap.** Bolt 2.6 dialog: `arialabelledby="customer-dialog-title"` (HTML attr, not bound). Bolt 3 buttons: `aria-label="Edit Test Customer"` (HTML attr, not bound). Same root cause: Angular property binding requires camelCase + `[brackets]`. Same axe failure mode: the attribute lands on the host wrapper but never reaches the rendered inner element. **This needs to be a project-wide named pattern in any prompt that touches PrimeNG ARIA.** Specifically: prompts must say "use `[ariaLabel]`, `[ariaLabelledBy]`, etc. — never lowercase HTML attributes on custom elements."
- **Patch 4's native `confirm()` shortcut.** To dodge the "Elements with role='dialog' do not have accessible names" audit on the delete confirm flow, the model replaced `<p-confirmdialog>` with browser-native `confirm()`. Functionally works, fully accessible (browsers handle native dialog a11y correctly), but visually breaks the design system continuity. The native modal looks like 1995 OS chrome in an otherwise Stripe / Vercel-tier UI. Logged as Bolt 6 polish work; not a Bolt 3 blocker because the visual regression doesn't appear in any case-study hero screenshots, but it's a known debt.
- **Plan estimate (50–70 min main + 1–2 patches) vs actual (60 min main + 4 patches in ~135 min).** The patch count was 2× the planned ceiling. Each patch was small (~25–40 min) but the cumulative cost was significant. The construction-time-comes-in-low pattern from Bolt 2.6 reappeared: main construction reported in ~60 min, but four follow-up patches were needed to actually ship. **Lesson: when main construction reports done, the visual + functional + a11y verification immediately following is part of "Bolt is done." A lower main-construction time is not a productivity win if the patches that follow take longer than the saved minutes.**
- **No screenshot capture instrumentation in the construction prompt.** Patch 3's diagnosis would have benefited from "before / after Lighthouse screenshots saved to docs/screenshots/bolt-3/" being explicit deliverables. They were deliverables in the Bolt 3 plan but the model didn't capture them automatically; the user did. **Lesson: any Gate Evidence that requires a screenshot should explicitly require the model to invoke screenshot tooling or instruct the user to capture and pass back, with named filenames.**

## Prompts That Worked

- **Bolt 3 main kickoff** — pointed at canonical plan with all 10 open questions pre-resolved + the 30-step Implementation Plan + named non-negotiable constraints (OnPush as default, toSignal for HTTP state, money never as JS number, plan-vs-actual sanity check). Single-prompt construction completed in ~60 min covering 3 entities + 12 endpoints + 3 pages + 27 new e2e tests. The pattern of pre-writing the plan with full Gate Evidence is now the project's marquee-feature standard.
- **Patch 4 kickoff** — included element-level diagnosis from `/customers` Lighthouse expansions PLUS mandatory Phase 0 diagnosis on the other 3 pages PLUS explicit "the user will re-verify your scores; discrepancies become test-credibility evidence in the case study." The threat of public verification appears to have produced a more honest patch.
- **Patch 2.1 kickoff** — three named defects with specific fix patterns (inline edit toggle architecture, top-right action zone for buttons, design-system polish via existing tokens), plus explicit out-of-scope list (no customer reassignment, no prescription editing — wait, prescription editing was added in Patch 2.1, so this should not have been out-of-scope). The pattern of explicit out-of-scope items reduced scope creep.

## Prompts That Failed

- **Patch 3 kickoff** — included Phase 0 diagnosis requirement, included mandatory Lighthouse re-verification, included "the user will re-verify; do not claim 100s you haven't observed." The model produced a Phase 0 diagnosis, claimed 100s anyway, and the audit still failed. **The prompt was rigorous but the verification mechanism was inside the model, not external.** The fix: any verification claim must be accompanied by a mechanism the user can independently check (paste of actual Lighthouse panel HTML, screenshot path, etc.) — but even that is only as good as the user's willingness to re-verify.
- **The original Bolt 3 main kickoff** — did not name the lowercase-`aria-*`-on-custom-elements anti-pattern. The model generated `aria-label="..."` on `<p-button>` thinking it would bind to the input. Had this been called out in the kickoff (e.g., "for any PrimeNG component prop binding, use camelCase + `[brackets]`"), Patches 3 and 4 would not have been needed for that specific failure mode.

## Process Changes for the Next Bolt

Carrying these into Bolt 4 (Receipt Generation) and beyond:

- **Every prompt that touches PrimeNG component bindings names the camelCase + `[brackets]` rule explicitly.** Lowercase HTML attribute on custom elements is a recurring trap that has now bitten this project twice. Make it project-standard.
- **Every patch's verification claims are independently re-verified by the user before any retro/PR work begins.** Patch 3 demonstrated that even rigorous prompting can produce false claims. The corrective is structural: re-verification is non-negotiable, not "if there's time."
- **Any model claim of a Lighthouse score must include a paste of the actual rendered DOM count (e.g., "23/25 with these failing audit names listed") or the user-side re-run is mandatory before the next step.** Naked "all 100" claims become a yellow flag.
- **Plan-vs-actual wall-clock sanity check needs to count patches, not just main construction.** Bolt 3's main came in at the lower end of the plan estimate; the four patches more than doubled the total. A "fast main" without a "patch budget" is misleading. Future plan estimates: main + expected-patch-budget.
- **Track the "automated check passes / reality broken" pattern explicitly in the metrics tracker** with a count column. Currently project-wide: 9 occurrences across Bolts 2 / 2.5 / 2.6 / 3. The case study should report this as a measured failure rate, not as anecdote.
- **Bolt 6 polish queue keeps growing and must be tracked.** Items now: (a) Bolt 1 hygiene patch was cleaned but the eventual Bolt 1 retro should be revisited if more leftovers surface, (b) restore branded `<p-confirmdialog>` (Patch 4 native `confirm()` shortcut), (c) anti-generic side-by-side capture, (d) any Lighthouse Performance optimization work that takes the production scores from 96/98 to 98+/100. Maintain a single `docs/bolt-plans/bolt-6.md` running list.
- **Screenshot capture is part of the Mob Construction kickoff prompt.** Named filenames + named locations + which audit goes where. Let the user instructions be paste-back-into-prompt-able rather than re-derived each time.

## Metrics Recorded

- Clock hours: **3.0** (~180 min total — ~60 main + ~15 Patch 1 + ~30 Patch 2 + ~25 Patch 2.1 + ~30 Patch 3 + ~40 Patch 4)
- Prompts: **6** (1 main kickoff + 5 patch kickoffs)
- LOC generated: **~2500–3500** main + patches (to be measured via `git diff main...HEAD --stat` before merge)
- LOC hand-written: **0**
- Tests added: **27 new e2e tests** (project total 14 → 41)
- Gate failures: **6** (Patch 1 NG0100 + Patches 2/2.1 quality issues + Patch 3 hallucinated 100s + Patch 4 ariaLabel-binding issues + native `confirm()` deviation)
- Production bugs found later: **0** (to be updated)
- Bundle delta: **840 → ~870 kB** approx (to be measured with `ng build --stats-json` before merge — three new components, three new DTOs, one new module)
- Bolt 2.6 deferred Gate Evidence items: **all 5 closed** (8 a11y at 100, performance ≥96 baseline held, reduced-motion ✓; only anti-generic remains user-deferred)

### Estimated Traditional Baseline

A senior full-stack developer working manually would need roughly **40–55 hours** to deliver Bolt 3:
- Schema design + migrations + FK rules + Prisma adapter handling: ~3–4h
- NestJS modules with three resources, DTOs, validation, guards, role enforcement, status-transition rules: ~10–14h
- Order number generation under concurrency (Postgres sequence per year): ~1–2h
- 27 e2e tests with supertest covering happy paths + role enforcement + FK + transitions + payments: ~6–8h
- Three Angular pages with OnPush + signals discipline: ~10–14h
- Customer picker + prescription 2×4 grid + status badge + payment dialog + edit mode (inline + prescription): ~4–6h
- Money handling end-to-end with PrimeNG quirks: ~2–3h
- Manual a11y + Lighthouse audits + Bolt 2.6 deferred-defect cleanup: ~2–3h
- Bug-fix loop equivalent to the four patches we shipped (NG0100 + edit polish + a11y twice): ~2–3h

**40 hours conservative; 55 hours realistic. Actual Bolt 3: 3.0 hours. Speedup: ~13–18×.**

This is **lower than Bolts 2 / 2.5 / 2.6** deliberately. The honest case-study claim: *AI-DLC delivered a marquee domain feature with three new entities, twelve endpoints, three full pages, inline edit mode, and 27 new e2e tests — at ~13–18× when the foundation is already in place, and the speedup compressed because novel domain logic shortens the traditional baseline too.* Anything higher than ~25× would have been suspicious.

### Caveat on the Bolt 3 speedup figure

The 13–18× ratio is the cleanest data point in the project so far for what AI-DLC actually delivers on novel domain work. Bolts 2 / 2.5 / 2.6's higher ratios (63×, 14×, 20×) were on well-scaffolded incremental work, design foundations, or aesthetic-on-foundation. Bolt 3 was the first Bolt that touched the actual handwritten-card-to-database translation — prescription field modeling, order lifecycle semantics, payment tracking — and it compressed exactly as the plan predicted. **This is the project's most case-study-defensible speedup ratio because it's against the highest-quality traditional baseline.** Future feature Bolts (4 receipt PDF, 5 dashboard, 6 polish) should be expected in the same 10–25× range.

## The Methodology Lesson That Earns Bolt 3 Its Place in the Case Study

Across Bolts 2, 2.5, 2.6, and 3, the same failure class has now occurred **nine times** with seven distinct mechanisms:

1. Bolt 2: file truncation while tests passed
2. Bolt 2.5: DOM boilerplate while build was clean
3. Bolt 2.6 main: 5 visual defects + 1 NG0100 while ng build succeeded
4. Bolt 2.6 dialog patch: lowercase `arialabelledby` not bound while DOM "looked right"
5. Bolt 3 main: 1 NG0100 in route animation while construction reported done
6. Bolt 3 Patch 1: claimed dialog accessible name fix that didn't address Lighthouse audit
7. Bolt 3 Patch 3: hallucinated 100 scores never actually observed
8. Bolt 3 Patch 4: native `confirm()` shortcut bypassing design system
9. Cross-Bolt: lowercase `aria-*` HTML attributes recurring across PrimeNG components

The case study claim earned by this body of evidence:

> **Across nine independent occurrences, automated checks (`ng build`, `npm test`, even Lighthouse runs reported by the model) failed to catch user-visible defects that direct browser observation caught immediately. Model verification claims and automated test results are not equivalent to "the gate passes." Only empirical user-side observation is. The mitigation is structural: every Bolt's Gate Evidence must include direct browser observation as a hard requirement, and every patch's verification claim must be independently re-verified before retro/PR work begins.**

This claim is grounded in **measured occurrences with named mechanisms**, not anecdote. It is the most defensible methodology contribution this project will make. The case-study post should lead with it.
