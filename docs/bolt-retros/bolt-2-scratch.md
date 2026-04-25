# Bolt 2 — Live Scratch Log

Keep this open while working. Update as you go. At the end of the Bolt, copy the totals into `bolt-2.md` retro and `metrics-tracker.md`, then delete or archive this file.

## Time

Start: 10:02 PM
End: ______
Total minutes: ______

## Prompt Log

Paste each prompt you send to Claude Code, plus a one-word quality tag: **good** (first-try usable), **ok** (usable after minor correction), **bad** (needed rework or re-prompt).

| # | Prompt (first 120 chars) | Tag | Notes |
|---|---|---|---|
| 1 | Start Bolt 2 — Customer Management — for the Optical Shop Management System. The full plan with Gate Evidence is already in... | good | Full context prompt with process rules; produced clean mob elaboration + branch creation |

## Issues Encountered

One line each. Don't write long explanations — the retro will expand the interesting ones.

-
-

## Gate Failures

List each Gate Evidence item that failed on first attempt. The retro will detail what went wrong and how it was fixed.

-

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
