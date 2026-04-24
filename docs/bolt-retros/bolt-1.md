# Bolt 1 Retro — Foundation & Auth

*Duration:* ~40 minutes, single session
*Branch:* `bolt/1-foundation-auth` (to be created on first git push)
*PR:* N/A (initial scaffold, no predecessor branch)

## What Shipped

- NestJS API scaffolded with modular structure (`auth/`, `prisma/`, `app.module.ts`)
- Prisma schema defining `User` model with `OWNER` / `WORKER` role enum
- JWT authentication with Passport.js strategy and `JwtAuthGuard`
- `@Roles()` decorator and `RolesGuard` for role-based endpoint protection
- Seeded initial Owner account (`owner` / `owner123`) on first run
- Angular 17+ app scaffolded with PrimeNG, routing, and standalone components
- Login page with PrimeNG card, input, button, and error message components
- `authGuard` and `roleGuard` on frontend routes
- `tokenInterceptor` attaching JWT to outbound HTTP calls
- Layout component with role-aware navigation
- Dashboard placeholder component

## Gate Evidence Results

| Gate | Pass / Fail | Notes |
|---|---|---|
| NestJS server starts on port 3000 without errors | ✅ | |
| Prisma migration runs, User table created in PostgreSQL | ✅ | |
| POST /auth/login returns JWT token | ✅ | |
| Owner account seeded (owner / owner123) | ✅ | |
| JWT contains correct role claim | ✅ | |
| Angular app starts, login page renders with PrimeNG | ✅ | |
| Successful login redirects to /dashboard | ✅ | |
| Failed login shows error message | ✅ | |
| Token saved to localStorage, interceptor attaches it | ✅ | |
| Route guard redirects unauthenticated users to /login | ✅ | |

## What AI-DLC Did Well

- **Mob Elaboration in a single conversation.** Intent statement, DDD model extraction from the physical card, bounded contexts, stack selection, and the full 6-Bolt breakdown — all produced in one thread. In a traditional workflow this is hours of grooming meetings spread across days.
- **Stack pivoting without rework.** Mid-Elaboration switch from ASP.NET Core to NestJS preserved all prior architectural decisions; only the backend section was regenerated.
- **End-to-end naming consistency.** `authGuard` and `roleGuard` named identically on backend and frontend; the role enum (`OWNER`, `WORKER`) flowed cleanly from Prisma schema → JWT payload → Angular role guard without rename drift.
- **Bulk file scaffolding.** 12+ backend files and 10+ frontend files generated in a single construction pass with correct module wiring.
- **Self-correction.** The agent caught its own structural issue (auth module imports placed after decorators) and fixed it without developer intervention.

## Where AI-DLC Struggled

- **Auth module structure.** Initial generation placed `@Module({...})` decorator imports at the bottom of the file — invalid NestJS pattern. Caught during construction and fixed, but would have been caught earlier if a lint step ran per file.
- **No automated tests generated.** The agent did not propose tests as part of Gate Evidence; tests were verified by manual walk-through only. This is the single biggest risk carried into Bolt 2 — from now on, every Bolt must ship with at least one integration test per new endpoint.
- **`.env` secret management not flagged.** The agent created `.env` with a placeholder `JWT_SECRET` and seeded an owner password of `owner123` but did not warn that the backend lacked a `.gitignore`. Leaking secrets on first push is a realistic risk the agent should have surfaced.
- **Boilerplate noise.** Default files from `nest new` and `ng new` (`app.controller.ts`, `app.service.ts`, Angular splash page `app.html`) were left in place. Cleaner Bolts in future should explicitly delete or repurpose these on creation.

## Prompts That Worked

The elaboration-phase prompt that drove the whole Bolt:

```
What is the mini project? The project is about the eye care shops where
shopkeeper can track the record of the customers. Right now, they are
using hard coded card to record the data. At the time, when customer
shop any frames and power glasses, they write it down all things in the
card and give it to customer and one card on the shop. So they want a
project where they can enter the information of customer and order and
also system can generate a receipt and that receipt will go to the
customer and system hold the record. Attached picture is of card what
they are using right now.

Who are the users? Shopkeepers who sells the frame and power glasses
and lenses.

What is the core outcome? They can track the record easily. They can
find the customer record, order record, remaining payments etc.

Any constraints? I want to do simple. For frontend, I want to use
Angular because I have expertise on it. PrimeNG if useful but not
required. For backend, you choose. Shopkeeper and their workers can
use the product so there should be a role system as well.
```

Why it worked: it answered all four Intent dimensions (problem, users, outcome, constraints) in one message, used the attached physical card as the source of truth for the domain model, and surfaced the role requirement naturally rather than as an afterthought.

The scaffold-trigger prompt:

```
Can you move all things to this folder and use it for further
development: D:\Claude Projects\Optical Shop Management System
```

Why it worked: explicit absolute path removed any ambiguity about target location, and "use it for further development" signaled this was the canonical workspace, not a throwaway.

## Prompts That Failed

No prompts outright failed in Bolt 1 — the main process gap was *prompts that were never written* (e.g., no explicit request for tests, no explicit request for a `.gitignore`, no explicit request to delete CLI boilerplate). Process change for Bolt 2 handles this by making these part of the Bolt's Definition of Done.

## Process Changes for the Next Bolt

- Start the Bolt by writing the Gate Evidence checklist *before* writing any code
- Add at least one integration test per endpoint from Bolt 2 onward
- Track prompts, clock time, and LOC during the Bolt instead of reconstructing after
- Verify `.gitignore` covers `.env`, `node_modules/`, `dist/`, `.angular/` before first push to GitHub

## Metrics Recorded

- Clock hours: **0.67 (~40 minutes total)**
- Prompts: **4**
  1. Intent + project description + users + core outcome + constraints
  2. Stack confirmation (switch from ASP.NET Core to NestJS)
  3. Database choice (PostgreSQL)
  4. "Move all to target folder" — triggered full scaffold
- LOC generated: **~668** (backend ~206, frontend ~462, excluding CLI splash page and default spec files)
- LOC hand-written: **0**
- Tests added: **0** (deferred to Bolt 2 by design)
- Gate failures: **1** — auth module had imports placed at the bottom of the file (invalid NestJS pattern); caught during construction, fixed by the AI agent before merge
- Production bugs found later: **0** (to be updated if a Bolt 1 regression surfaces in a later Bolt)

### Estimated Traditional Baseline

A senior developer working manually would need roughly 12–16 hours to reach the same Gate Evidence: ~6–8 hours for the NestJS API with JWT + Passport + role guards + Prisma, and ~6–8 hours for the Angular app with PrimeNG + auth service + interceptor + guards + login + layout.

Actual AI-DLC: **0.67 hours** → roughly **18× faster** against the conservative baseline, **~24× faster** against the realistic one.
