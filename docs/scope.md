# Project Scope — Optical Shop Management System

## Intent

Enable optical shop owners and their staff to digitally manage customer records, eye prescriptions, and orders — replacing handwritten cards with a searchable, role-aware system that tracks payments, generates printable receipts, and gives the owner real-time visibility into pending deliveries and outstanding balances.

The outcome is not "a web app." The outcome is a shopkeeper at the counter being able to answer, in under ten seconds, questions they currently cannot answer at all: *"Who still owes me money?"*, *"What was Mr. Khan's last prescription?"*, *"Which orders are ready for pickup today?"*

## Problem Context

Optical shops across the region rely on printed or handwritten cards to record each customer's details, prescription values (SPH / CYL / AXIS for both eyes), frame and lens choices, order dates, delivery dates, and payment status. One copy is handed to the customer; another is kept at the shop. This creates several recurring pain points:

- No way to search customer history without flipping through physical cards
- Outstanding balances are tracked from memory or a separate ledger
- Prescriptions for repeat customers must be re-written by hand on each visit
- Receipts are inconsistent and sometimes illegible
- Workers and owners have identical access — no separation of financial data

## Users and Roles

The system has two roles, enforced via JWT claims and route-level guards on both backend and frontend.

**Owner** — the shop owner. Full access: customer and order CRUD, financial dashboards, user management, reports. Responsible for seeding their own shop's initial data.

**Worker** — counter staff. Can create customers, enter orders and prescriptions, print receipts, and mark orders as delivered. Cannot see aggregate financial data or delete records.

## Core Domain Model

Derived directly from the fields on the physical card used by the target shop.

```
┌─────────────────┐     ┌──────────────────────┐     ┌───────────────┐
│    Customer     │────▶│        Order         │────▶│  Prescription │
├─────────────────┤     ├──────────────────────┤     ├───────────────┤
│ id              │     │ invoiceNumber        │     │ rightEye      │
│ name            │     │ orderDate            │     │   SPH, CYL,   │
│ contact         │     │ deliveryDate         │     │   AXIS        │
│ address         │     │ frameDetails         │     │ leftEye       │
│ createdAt       │     │ lensDetails          │     │   SPH, CYL,   │
└─────────────────┘     │ totalAmount          │     │   AXIS        │
                        │ advancePaid          │     │ type (R/D/CL) │
                        │ balanceDue           │     └───────────────┘
                        │ notes                │
                        │ status               │
                        └──────────────────────┘

┌──────────────────┐
│      User        │
├──────────────────┤
│ id               │
│ name             │
│ username         │
│ password (hash)  │
│ role             │
└──────────────────┘
```

### Bounded Contexts

- **Identity** — User, Role, Authentication
- **Customer** — Customer records, search, history
- **Ordering** — Order, Prescription, Invoice numbering, Payment tracking
- **Reporting** — Aggregates over Ordering (owner-only)

### Ubiquitous Language

*Card* (legacy term, used only in problem framing, not in code) → *Order* in the system.
*Power glasses* → lens prescription strength values.
*Frame* → physical eyeglass frame selected by the customer.
*Advance* → partial payment made at order time.
*Balance* → remaining amount due at delivery.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Angular 17+ with PrimeNG | Existing developer expertise; PrimeNG gives production-ready components (DataTable, forms, dialogs) out of the box |
| Backend | NestJS | TypeScript-first, matches frontend language, first-class Passport/JWT support, structured module system |
| ORM | Prisma | Type-safe queries, excellent migrations workflow, minimal boilerplate |
| Database | PostgreSQL | Relational integrity fits the domain; easy local dev and cloud hosting |
| Auth | JWT + Passport.js | Stateless, works well with role-based route guards on both sides |
| PDF | Puppeteer (planned, Bolt 4) | Full HTML fidelity for receipt output |
| Hosting (planned) | Azure App Service + Azure Postgres | Microsoft ecosystem familiarity |

## Non-Goals for MVP

Called out explicitly to prevent scope creep during Bolts 2–6:

- Multi-shop / multi-tenant support
- Inventory tracking (frame stock, lens stock)
- Customer-facing portal or mobile app
- Appointment scheduling
- Integration with lab / supplier ordering systems
- SMS / email notifications
- Insurance claim handling

These are deliberately excluded so the core record-keeping loop ships first.

## Bolts Roadmap

Each Bolt is a shippable, testable slice. Gate Evidence is the checklist that proves the Bolt actually works, not just compiles.

### Bolt 1 — Foundation & Auth ✅ (Complete)

Running Angular app + NestJS API + login with role-based guards.

*Delivered:* JWT auth, Owner/Worker roles, route guards on both frontend and backend, seeded owner account, token interceptor, PrimeNG login UI.

### Bolt 2 — Customer Management

Create, search, view, and edit customers.

*Gate Evidence:* Create a customer, find them by name and by contact number, edit their details, and see the updated record reflected in the list view.

### Bolt 3 — Order + Prescription Entry

Create orders linked to a customer with full prescription capture.

*Gate Evidence:* A full order matching every field on the physical card can be created, saved, and retrieved. Invoice number auto-generates. Balance auto-calculates from total minus advance.

### Bolt 4 — Receipt Generation

Server-generated printable PDF receipt that mirrors the card layout.

*Gate Evidence:* Clicking "Print Receipt" on any order produces a PDF containing invoice number, customer details, prescription table, frame/lens details, and payment breakdown.

### Bolt 5 — Dashboard & Payment Tracking

Owner sees outstanding balances, pending deliveries, and daily stats at a glance.

*Gate Evidence:* Dashboard lists all customers with unpaid balances in under one second. Owner can filter by date range and mark balances as paid.

### Bolt 6 — Role Permissions & Polish

Worker vs Owner access enforced end-to-end, tablet-friendly UI.

*Gate Evidence:* A Worker account cannot access the dashboard or financial views and cannot delete records. The UI renders correctly on a 10-inch tablet held in landscape at the shop counter.

## Definition of Done (Per Bolt)

A Bolt is not done until all of the following are true:

1. All Gate Evidence checkpoints for the Bolt pass.
2. Backend endpoints have at least one passing integration test per happy path and per primary error case.
3. Frontend screens render without console errors.
4. Code is committed on a branch named `bolt/<n>-<slug>` and merged via PR.
5. A short retro is appended to `docs/bolt-retros/bolt-<n>.md` covering what AI-DLC did well, where it struggled, and any process changes for the next Bolt.
6. The metrics tracker in `docs/metrics-tracker.md` is updated with actual hours, prompts, and LOC for the Bolt.
