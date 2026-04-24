# AI-DLC Methodology Applied to This Project

This document records how this project was built using an AI-Driven Development Lifecycle (AI-DLC) rather than a traditional Agile / Scrum cycle. It is intended as both an internal reference and as source material for public writing about the process.

## Why AI-DLC, Not Agile

Traditional Agile was designed to coordinate humans around uncertain requirements over weeks-long sprints. When the primary bottleneck is coordination — standups, grooming, estimation, sprint planning, retros — ceremony makes sense.

When the primary contributor is an AI coding agent operating at minutes-per-feature speed, most of that ceremony becomes pure overhead. The bottleneck shifts from *how fast can the team build* to *how precisely can the human define the outcome and verify the result*. AI-DLC restructures the work around that new bottleneck.

## The Shift

| Traditional SDLC | AI-DLC |
|---|---|
| Sprint (2 weeks) | Bolt (hours to ~1 day) |
| Epic / User Story | Intent (outcome-focused brief) |
| Scrum Master coordinating humans | Developer orchestrating AI agents |
| Design phase → Dev phase → QA phase | Mob Elaboration → Mob Construction → Gate Evidence, per Bolt |
| Estimation in story points | Estimation in clock-time to first Gate Evidence pass |
| Standup = sync communication | Async artifacts (commits, retros, screenshots) replace meetings |
| QA at end of sprint | Gate Evidence gates every Bolt merge |

## The Five Core Artifacts

### 1. Intent

A one-paragraph statement of the desired business outcome, not the implementation. For this project, the Intent is in [scope.md](./scope.md) and leads with *"Enable optical shop owners and their staff to..."* — not *"Build a web app with Angular and NestJS."*

A good Intent is:
- Outcome-focused, not feature-focused
- Specific enough that a reader can identify when it is achieved
- Implementation-agnostic (language, framework, and UI choices come later)

### 2. Domain Model

A DDD-flavored model of the business domain, written *before* any Bolt is planned. For this project, the model was extracted directly from the physical card the shop currently uses — Customer, Order, Prescription, User — with relationships and bounded contexts made explicit.

Baking DDD into the Intent and scope doc means every subsequent prompt to the AI agent references a shared vocabulary. The agent does not need to re-invent naming conventions per file.

### 3. Bolts

A Bolt is a time-boxed, independently deployable unit of work. For this project, Bolts are sized to roughly one working day. Each Bolt has:

- A Deliverable statement (what must be shippable at the end)
- A Gate Evidence checklist (what must be demonstrably working)
- A named branch (`bolt/<n>-<slug>`)
- A retro file written after merge

The six Bolts are listed in [scope.md](./scope.md).

### 4. Mob Elaboration and Mob Construction

**Mob Elaboration** is the pre-build conversation between the developer and the AI agent. Output: a refined scope, risks called out, DDD updates if needed, and a concrete construction plan.

**Mob Construction** is the build itself. The AI agent generates code; the developer reviews, steers, corrects, and validates every meaningful chunk. The developer does not type the code, but is still fully accountable for every line merged.

For Bolt 1 of this project, Mob Elaboration happened in the Claude Code thread that established the tech stack, DDD model, and file structure. Mob Construction produced the initial scaffolding of both repos in a single session.

### 5. Gate Evidence

Every Bolt must produce proof it works. For this project, Gate Evidence is a checklist in the Bolt definition, and each item must be verifiable — not "the feature exists" but "this specific user journey completes without error."

Gate Evidence is intentionally heavier than traditional unit-test-only QA because AI-generated code tends to be syntactically correct but behaviorally wrong. Human validation of the full user journey is the safety net.

## The Loop

```
                    ┌──────────────────────┐
                    │     INTENT           │
                    │ (business outcome)   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   MOB ELABORATION    │
                    │ Human + AI refine    │
                    │ scope, risks, model  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    BOLT PLANNING     │
                    │ Break into ~1-day    │
                    │ shippable units      │
                    └──────────┬───────────┘
                               │
                               ▼
              ┌───────────────────────────────────┐
              │                                   │
              ▼                                   │
  ┌──────────────────────┐                        │
  │  MOB CONSTRUCTION    │                        │
  │ AI builds, developer │                        │
  │   reviews & steers   │                        │
  └──────────┬───────────┘                        │
             │                                    │
             ▼                                    │
  ┌──────────────────────┐                        │
  │   GATE EVIDENCE      │                        │
  │ Tests, screenshots,  │                        │
  │ journey verification │                        │
  └──────────┬───────────┘                        │
             │                                    │
             ▼                                    │
  ┌──────────────────────┐                        │
  │   PER-BOLT DEPLOY    │                        │
  │ Merge, tag, deploy   │                        │
  └──────────┬───────────┘                        │
             │                                    │
             ▼                                    │
  ┌──────────────────────┐                        │
  │       RETRO          │                        │
  │ What worked, what    ├────────────────────────┘
  │ broke, next changes  │    (informs next Bolt)
  └──────────────────────┘
```

## Tooling in Use

- **Claude Code** — primary AI coding agent for Mob Construction
- **Prisma Migrate** — versioned database changes as part of Gate Evidence
- **Manual Gate Evidence** — for Bolt 1, verification was a human walk-through of the login journey; automated tests to be added from Bolt 2 onward

## Open Questions for Future Bolts

Tracked so they can be resolved in the Mob Elaboration step of the relevant Bolt, not guessed at mid-Construction:

- Bolt 3: Should Prescription be a separate aggregate or an entity inside Order? (Leaning toward entity inside Order, since a Prescription without an Order has no independent lifecycle in this domain.)
- Bolt 4: Puppeteer vs PDFMake vs QuestPDF-via-microservice for receipt PDF generation?
- Bolt 5: Should "mark as paid" be an event (append-only payment history) or a mutation (update balance)? Event sourcing may be overkill for MVP but improves auditability.
- Bolt 6: Session duration — 8 hours default was chosen in Bolt 1 for shop-counter usability; revisit with owner input.
