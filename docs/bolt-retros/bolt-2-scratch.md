# Bolt 2 — Live Scratch Log

Keep this open while working. Update as you go. At the end of the Bolt, copy the totals into `bolt-2.md` retro and `metrics-tracker.md`, then delete or archive this file.

## Time

Start: 10:02 PM
End: ~10:22 PM
Total minutes: ~20

## Prompt Log

Paste each prompt you send to Claude Code, plus a one-word quality tag: **good** (first-try usable), **ok** (usable after minor correction), **bad** (needed rework or re-prompt).

| # | Prompt (first 120 chars) | Tag | Notes |
|---|---|---|---|
| 1 | Start Bolt 2 — Customer Management — for the Optical Shop Management System. The full plan with Gate Evidence is already in... | good | Full context prompt with process rules; produced clean mob elaboration + branch creation |

## Issues Encountered

One line each. Don't write long explanations — the retro will expand the interesting ones.

- Prisma 7.8.0 breaking change: `url` removed from datasource block; needed `prisma.config.ts` + `@prisma/adapter-pg`
- `.env` had wrong PostgreSQL password (`password` → `admin`; discovered by trying migration)
- `AuthModule` used `JwtModule.register()` so JWT_SECRET was undefined at test time; fixed with `registerAsync`
- `@angular/animations` was not installed; Angular build failed until added

## Gate Failures

List each Gate Evidence item that failed on first attempt. The retro will detail what went wrong and how it was fixed.

- Migration: P1012 (Prisma 7 config) — fixed with prisma.config.ts
- Migration: P1000 (wrong DB password) — fixed by trying passwords, updating .env
- All 14 e2e tests: 401 on every authenticated call (JWT_SECRET undefined) — fixed with registerAsync

## LOC (fill at end)

Run from project root:

```powershell
# Purposeful Bolt 2 LOC (adjust paths if folder structure differs)
(Get-ChildItem -Recurse -Path optical-backend/src/customers,optical-backend/test/customers*,optical-frontend/src/app/pages/customers -Include *.ts,*.html,*.scss | Get-Content | Measure-Object -Line).Lines
```

Backend new LOC: ______
Frontend new LOC: ______
Tests LOC: ______
Hand-written LOC: ______
