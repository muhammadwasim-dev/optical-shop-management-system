# Bolt 2 Retro — Customer Management

*Duration:* ~13 minutes 19 seconds, single uninterrupted Claude Code session (2026-04-25)
*Branch:* `bolt/2-customer-management`
*PR:* (to be opened on push)

## What Shipped

- `Customer` aggregate added to Prisma schema; `customers` table created via migration `20260425171215_add_customer`
- Five REST endpoints under `/customers`: POST, GET (list with `?search=`), GET (by id), PATCH, DELETE
- Server-side case-insensitive search by name or contact (`?search=...`)
- Role-gated DELETE: OWNER → 204, WORKER → 403
- WORKER account seeded on boot alongside OWNER (`worker` / `worker123`)
- 14 supertest integration tests covering happy path and primary error cases for every endpoint
- Angular feature module at `pages/customers/`: PrimeNG DataTable, debounced search input (~300ms), add/edit dialog with reactive form, ConfirmDialog-gated delete, Toast notifications
- `/customers` lazy route added to `app.routes.ts` behind `authGuard`
- Migrated to Prisma 7 driver-adapter pattern: `prisma.config.ts` + `@prisma/adapter-pg` + `pg`
- Three pre-existing Bolt 1 issues fixed in-flight: missing `@angular/animations` dependency, `JWT_SECRET` undefined at module-registration time during tests (switched to `JwtModule.registerAsync`), placeholder `.env` `DATABASE_URL` password

## Gate Evidence Results

| Gate | Pass / Fail | Notes |
|---|---|---|
| Migration `20260425171215_add_customer` applies cleanly | ✅ | |
| `customers` table exists with correct columns | ✅ | confirmed in migration SQL |
| POST /customers valid body → 201 | ✅ | e2e test |
| POST /customers missing name → 400 | ✅ | e2e test |
| POST /customers no Auth header → 401 | ✅ | e2e test |
| GET /customers returns array | ✅ | e2e test |
| GET /customers?search= case-insensitive | ✅ | e2e test |
| GET /customers/:id returns customer | ✅ | e2e test |
| GET /customers/:id unknown UUID → 404 | ✅ | e2e test |
| PATCH /customers/:id partial update | ✅ | e2e test |
| DELETE as OWNER → 204 | ✅ | e2e test |
| DELETE as WORKER → 403 | ✅ | e2e test |
| WORKER account seeded on boot | ⚠️ → ✅ | Tests passed because Claude Code's in-memory module had the complete `seedUsers()` body when Jest loaded it. Source on disk was truncated mid-statement (`auth.service.ts` ended at `    con` without the WORKER block or the closing braces of the function and class). Discovered during pre-walk-through file-integrity check; restored by hand. |
| Angular build compiles clean | ✅ | `ng build` succeeded |
| `/customers` UI walk-through (OWNER + WORKER journeys) | (manual — pending walk-through) | |

## What AI-DLC Did Well

- **One prompt, zero intervention.** A single kickoff prompt — pointing at `docs/bolt-plans/bolt-2.md`, `docs/scope.md`, and `docs/ai-dlc-methodology.md` — drove the entire Bolt. No follow-up clarification, no manual unblocking, no "try again" prompts. The pre-written plan with full Gate Evidence checklist *was the conversation*; Claude Code consumed it and executed.
- **Test discipline shipped.** 14 supertest integration tests authored as a Gate Evidence requirement, not an afterthought. Every endpoint has a happy path plus its primary error case (400 / 401 / 403 / 404). This is the single biggest qualitative leap from Bolt 1, where 0 tests shipped.
- **Self-driven dependency hygiene.** Three latent bugs from Bolt 1 surfaced naturally and were fixed without prompting: missing `@angular/animations`, the `JWT_SECRET` registration-timing bug exposed by Jest's module bootstrap order, and a `.env` placeholder password that broke the migration on first run. None of these were called out in the plan.
- **Handled a runtime breaking change without help.** Prisma 7.8.0 forbids `url` in the `datasource` block of `schema.prisma`. Claude Code diagnosed the migration failure, added `prisma.config.ts`, installed `@prisma/adapter-pg` and `pg`, and rewired `PrismaService` to use the driver adapter — a non-trivial migration that a developer would normally hit once and remember forever. Logged as a deviation from the plan, not as a failure.
- **Plan-driven Mob Elaboration was effectively zero-cost.** The four "Risks and Open Questions" in the plan (server-side search, PATCH semantics, address trimming, exposing `createdAt`) were resolved by reading the plan; no Elaboration round-trip was needed. This is the structural advantage of pre-writing the plan with explicit decision points.

## Where AI-DLC Struggled

- **Source-on-disk silently truncated.** The single most important finding of the Bolt. `auth.service.ts` was fully written at some point during construction — Jest loaded the complete module and 14 tests passed. A subsequent edit then truncated the file mid-statement (ended with `    con`, no WORKER seed block, no closing braces for `seedUsers()` or the class itself). The Bolt summary reported the WORKER seed as shipped (because B13 passed) and the build status was not re-verified after the truncation. **Tests passing did not mean the source on disk compiled.** This is the kind of failure mode that any process change for Bolt 3 has to address.
- **No final `npm run build` / `tsc --noEmit` Gate Evidence item.** The plan's Gate Evidence list ended with `npm run test:e2e` — but tests run against a *previously compiled or in-memory* state and can hide source corruption that hasn't been re-compiled yet. A clean build after tests would have caught this in seconds.
- **Plan deviation tracking was opportunistic, not systematic.** The deviation table in the Bolt summary captured the Prisma 7 change and the JWT_SECRET fix, but only because they were obvious. Smaller deviations (e.g., not adding the "Customers" link to the layout nav as listed in plan step 8 — to be verified during walk-through) may have slipped through. Future Bolts should walk the implementation-plan list and check off each step explicitly.
- **Manual UI walk-through still owes the WORKER half of E2E Journey verification.** Tests cover the `WORKER cannot delete` HTTP behavior but not the UI assertion that "Delete button is not rendered." Until the walk-through happens, that journey is unverified.

## Prompts That Worked

The kickoff prompt that drove the entire Bolt (one prompt, zero follow-ups):

```
Start Bolt 2 — Customer Management — for the Optical Shop Management System.

The full plan with Gate Evidence is already in the repo at
docs/bolt-plans/bolt-2.md. Please read that first, along with
docs/scope.md and docs/ai-dlc-methodology.md, before writing any code.

Bolt 1 (Foundation & Auth) is complete — auth module, role guards,
Prisma setup, and login UI are all in place. Do not re-scaffold those.

Process rules for this Bolt (carried over from the Bolt 1 retro):

1. Mob Elaboration FIRST. Answer the four "Risks and Open Questions"
   in bolt-2.md before generating any code. State your decisions
   back to me in one short block.

2. Ship at least one integration test per new endpoint (happy path +
   primary error case). Tests are Gate Evidence, not optional.

3. Seed the WORKER account alongside the existing OWNER seed — the
   Gate Evidence E2E Journey needs both roles to be demonstrable.

4. At the end, produce a single summary with:
   - Every file created/modified
   - Gate Evidence items verified automatically (tests/migration)
   - Gate Evidence items requiring manual walk-through (UI journey)
   - Any deviation from the plan with a one-line reason

5. Keep docs/bolt-retros/bolt-2-scratch.md open and log each prompt
   you receive with a quality tag (good / ok / bad) as you go.

Work on branch bolt/2-customer-management. Do not merge to main.
```

Why it worked: it pointed at the canonical plan rather than restating the scope (single source of truth), enumerated the explicit process rules carried over from the Bolt 1 retro, and demanded a structured summary at the end. The "do not re-scaffold Bolt 1" guardrail prevented a common failure mode (regenerating already-shipped code). The "produce a single summary" instruction is what made the post-Bolt verification possible at all — without it there would be no list of files to check for truncation.

## Prompts That Failed

No prompts failed — only one prompt was sent. The failure mode in Bolt 2 was *post-summary verification*, not prompt quality. The Bolt 1 retro flagged "no Bolt-end build check"; that gap remained open in Bolt 2's plan and got exploited.

## Process Changes for the Next Bolt

Carrying these into Bolt 3 (Order + Prescription Entry):

- **Add a "Bolt-end build check" Gate Evidence item to every plan from Bolt 3 onward.** Specifically: `cd optical-backend && npm run build` and `cd optical-frontend && ng build` must complete with zero errors, *after* tests run, before the Bolt is declared done. This catches source-on-disk corruption that warm processes hide.
- **Add a "file integrity check" step to the Bolt summary verification.** After Claude Code returns the summary, run `wc -l` on every file in the created/modified list and spot-check the last lines (`tail`) of any non-trivial file. This is a 60-second check that would have caught the `seedUsers()` truncation immediately.
- **Walk the implementation-plan checklist explicitly during the walk-through.** Don't rely on the Bolt summary's deviation table to catch every gap — physically tick each numbered step in the plan against the resulting code.
- **Pre-write the Bolt plan with Gate Evidence before kickoff (continued from Bolt 1 retro).** This is now proven: Bolt 2's single-prompt, zero-intervention run was only possible because the plan had already done the cognitive work. Bolt 3's plan should be written *before* any kickoff prompt is sent.
- **Backfill a tiny `seed-verification` test for the auth module.** A single boot-time test that asserts both `owner` and `worker` users exist in the DB after `AuthService.onModuleInit` would have made the truncation visible in the test run, not at walk-through time.

## Metrics Recorded

- Clock hours: **0.22 (~13 minutes 19 seconds, single uninterrupted run)**
- Prompts: **1**
- LOC generated: **~720** (backend ~440 — 378 new + ~60 modified; frontend ~281 — 278 new + ~3 modified)
- LOC hand-written: **13** (post-Bolt patch to restore truncated `seedUsers()` block; **0** during the Bolt itself)
- Tests added: **14** (e2e integration, all 5 endpoints + happy/error paths)
- Gate failures: **1** (`auth.service.ts` source-on-disk truncation, discovered post-hoc during pre-walk-through file-integrity check; all 14 automated tests passed because Claude Code's in-memory module was complete at test time)
- Production bugs found later: **0** (to be updated if a Bolt 2 regression surfaces in a later Bolt)

### Estimated Traditional Baseline

A senior developer working manually would need roughly 14–18 hours to deliver the same Gate Evidence: ~1–2h for the Prisma 7 migration (most of which is diagnosing the breaking change the first time), ~3–5h for the NestJS resource module with five endpoints, DTOs, validation, JWT + role guards, ~2–3h for 14 supertest integration tests against a real Postgres, ~5–7h for the Angular feature module with PrimeNG DataTable, debounced search, add/edit dialogs, role-gated delete, ConfirmDialog, Toast, and ~1h for the three pre-existing-bug fixes that surfaced (`JwtModule.registerAsync`, missing `@angular/animations`, `.env` password).

Actual AI-DLC: **0.22 hours** → roughly **63× faster** against the conservative baseline, **~82× faster** against the realistic one.

This figure should be read alongside the credibility caveat in the metrics tracker: Bolt 2 was an unusually clean second Bolt because the DDD skeleton was already in place, the plan was pre-written with explicit decision points, and the scope was textbook CRUD. Bolt 3 will compress the speedup by introducing genuine domain modeling (handwritten-card translation, prescription value objects, order-customer linkage). The 63x–82x ratio is the upper bound of what AI-DLC delivers on well-scaffolded incremental work, not a project-wide claim.
