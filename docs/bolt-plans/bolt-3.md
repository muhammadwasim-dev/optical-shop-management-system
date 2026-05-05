# Bolt 3 Plan — Order + Prescription Entry

*Branch:* `bolt/3-orders-prescriptions`
*Depends on:* Bolts 1, 2, 2.5, 2.6 — all merged to `main`. Bolt 1 hygiene gap #2 cleaned via `chore/pre-bolt-3-cleanup`.

## Why Bolt 3 matters

This is the **marquee feature Bolt** — the actual "replace the handwritten card" deliverable. Until this Bolt ships, the project is a customer directory with branding. After this Bolt ships, it is a working optical-shop point-of-sale system.

It is also the first Bolt where AI-DLC's speedup will compress, not because the methodology slows down but because the traditional baseline becomes faster. Bolt 2's 63×–82× ratio was the upper bound on incremental CRUD; Bolt 3's expected ratio is more like **~10×–15×** because the traditional baseline is shorter (CRUD on a known schema is ~5h regardless of methodology). Honest numbers in this range earn the case study credibility that 80× claims forfeit.

The methodology lessons accumulated in Bolts 1, 2, 2.5, 2.6 are now standing constraints on this Bolt — not "ideas to consider":

- **Direct browser observation (DevTools Console + Network + DOM) is mandatory Gate Evidence on every frontend-touching change.** "Automated tests pass, user-visible behavior is broken" has occurred in three consecutive Bolts. This is the dominant failure class of AI-DLC on this project.
- **`ChangeDetectionStrategy.OnPush` is the default for all new standalone signal-driven components.** The Bolt 2.6 NG0100 saga proved that OnPush is the canonical fix, not `queueMicrotask` or `detectChanges()`.
- **Lighthouse Performance Navigation against the production build is the standing baseline channel.** Dev-server numbers are misleading. The Bolt 2.6 baseline is **96** (FCP 0.8s, LCP 1.1s, TBT 0ms, CLS 0.002, Speed Index 1.6s) — Bolt 3 must hold this number on `/orders`.
- **Lighthouse Accessibility ≥ 95 on every new page in both themes.** Bolt 3 also closes the two deferred `/customers` defects from Bolt 2.6.
- **The patch-loop template** (named defects with file paths + process rules + required summary structure + mandatory runtime browser evidence) is the working pattern for any post-construction defect cleanup.

## Domain Thesis (the most important section — read twice)

**The target user is a neighborhood Pakistani optical-shop owner currently using handwritten cards.** Not a chain (Lenskart, Specsavers). Not an online retailer. A small shop with one optometrist, one or two staff, walk-in customers, and a card box in the back room where every customer's prescription, order, and balance lives until paid.

The handwritten card has, by ethnographic observation:

1. **Customer name + phone** (already covered in Bolt 2)
2. **Prescription** — sphere, cylinder, axis, ADD (for near vision in bifocals/progressives), PD; right and left eye separately. Often filled out by the optometrist in the same shop or transcribed from an external eye-test report.
3. **Frame description** — free text. "Black metal frame, model XX-2034, size 52-18-140." Sometimes structured (a brand + model master list); usually not.
4. **Lens spec** — single vision / bifocal / progressive; coatings (anti-reflective, blue-light filter, photochromic). Free text in practice.
5. **Total amount + advance + balance** — the three numbers that matter most for business.
6. **Order status** — written as a date stamp ("Sent 12 Apr", "Ready 18 Apr", "Delivered 20 Apr") rather than a status code. The shop owner glances at the card to know where the order is.
7. **Payment events** — written in the margin. "Rs. 2000 advance 12 Apr", "Rs. 3500 balance 20 Apr".

The system Bolt 3 builds must replace the card without losing any of this. It must also feel **faster than writing**, not just functionally equivalent — otherwise the shop owner will drift back to paper.

**Reference anchors.** When an aesthetic or interaction decision is ambiguous during construction, look at these specific products and pick the answer closest to them:

- **Lenskart order detail page** (Indian eyewear retailer — same subcontinental UX expectations, same prescription field semantics, same status-stamping pattern) — *primary anchor for the order detail page*
- **Stripe invoice detail page** (line items + payment history pattern; clean money-field rendering; status badge gravitas) — *primary anchor for the payment-history section*
- **Linear issue detail** (status-history visualization, audit trail, side panel) — *secondary anchor for the status timeline*

The app should feel like Lenskart's order page if Lenskart's CTO had read Stripe's design system. Not a clone. A peer.

**Anti-generic checks.** If any of these are *not true*, the Bolt has drifted back to median:

- The order detail page does not look like a generic admin form — it has visual hierarchy (top: customer + status; middle: prescription + frame + lens; bottom: payments + total). Each section has its own card with subtle elevation.
- The status badge is a real badge — colored chip with appropriate brand-gradient or status-tinted glow, not flat PrimeNG `<p-badge>` defaults.
- Money fields are **right-aligned**, monospaced (Geist Mono from Bolt 2.6), with explicit "Rs." prefix and grouping. They look like real receipts.
- Prescription fields render as a 2×4 mini-grid (right eye column + left eye column × SPH / CYL / AXIS / ADD rows), not as a flat list of 8 inputs. This is what the handwritten card does.
- Status transitions feel like clicks on a timeline, not dropdown changes. (Stretch goal — if construction time allows.)

## Intent (Bolt-level)

Enable shop staff to record an order from a walk-in customer and track it from creation through delivery and payment, replacing the handwritten card with a faster, searchable, auditable digital record. Enable the owner to see at a glance which orders are pending delivery and which have outstanding balances — the two business-critical questions a shop owner asks the card box every morning.

## Scope

### In scope (Bolt 3)

- **Backend**
  - Prisma schema additions: `Prescription`, `Order`, `Payment` entities with FK relationships; `OrderStatus` and `PaymentMethod` enums
  - Migration: `add-orders-prescriptions-payments`
  - NestJS modules: `OrdersModule`, `PrescriptionsModule`, `PaymentsModule` (or a single `OrdersModule` with sub-resources — pick the simpler approach during construction)
  - DTOs with `class-validator` rules matching the validation table below
  - Order number generation: `ORD-YYYY-NNNN` (year prefix + 4-digit zero-padded sequence per year, atomic via Postgres sequence or transactional max+1)
  - Endpoints (all JWT-guarded):
    - `POST /orders` — create order with nested prescription (transactional)
    - `GET /orders` — list with pagination, search (orderNumber + customer name), filter (status multi-select)
    - `GET /orders/:id` — detail including prescription + payments
    - `PATCH /orders/:id` — update mutable fields (frame, lens, totalAmount; not status)
    - `PATCH /orders/:id/status` — status transition (forward-only for WORKER, anywhere-to-anywhere for OWNER)
    - `DELETE /orders/:id` — OWNER only; cascade-delete prescription + payments
    - `POST /orders/:id/payments` — record a payment event
    - `GET /orders/:id/payments` — list payment events for an order
    - `DELETE /orders/:id/payments/:paymentId` — OWNER only (mistake correction)
  - Role guards: `OWNER` and `WORKER` from Bolt 1
  - e2e tests with supertest: target ~22 tests covering happy paths, validation failures, role enforcement, status transition rules, FK constraint enforcement (cannot delete customer with orders)
  - **Bolt 1 hygiene check:** the rewritten `app.e2e-spec.ts` (root 404 assertion from `chore/pre-bolt-3-cleanup`) must remain passing
  - **Bolt 2 regression:** all 14 customer e2e tests must remain passing

- **Frontend**
  - Standalone components, **`ChangeDetectionStrategy.OnPush` on every new component**, signals + `toSignal()` for HTTP state
  - New routes:
    - `/orders` — list page (PrimeNG `<p-table>` with search bar + status filter chips + paginator)
    - `/orders/new` — create page (multi-section form: customer picker → prescription → frame/lens → totals)
    - `/orders/:id` — detail/edit page (read-only header + editable sections + payment history + status timeline)
  - Customer picker: typeahead from existing customers (don't re-create) with "Add new customer" inline option that opens the Bolt 2 add-customer dialog
  - Prescription form: 2-column layout (Right eye | Left eye), each column has SPH / CYL / AXIS / ADD inputs; PD as a single field below; type as `<p-selectbutton>`
  - Money inputs: `<p-inputnumber>` with `mode="currency"` and `currency="PKR"`, locale `en-PK`, prefix `"Rs. "` (or just locale + 2 decimal places — see implementation note below)
  - Status badges: branded colored chips with the appropriate accent token (CREATED = neutral, IN_PROGRESS = indigo, READY = violet/fuchsia gradient, DELIVERED = green-ish — pick from existing tokens)
  - Status transition controls: WORKER sees a single "Move to next status" button; OWNER sees full dropdown
  - Payment recording dialog: opens from order detail, captures amount + method + note, posts and refreshes the order
  - Empty state for orders list: illustrated empty-state card matching the customers empty-state pattern from Bolt 2.6
  - Page-load motion: same fade-up + 50ms stagger pattern from Bolt 2.6
  - Route transitions: same wrapper-level fade+slide from Bolt 2.6

- **Two deferred Bolt 2.6 `/customers` a11y defects** (named Gate Evidence items, see below):
  - Add/Edit Customer `<p-dialog>` gets `aria-labelledby` to its header element (or `aria-label` if header is dynamic)
  - Role badge chip contrast ratio raised above WCAG AA — adjust the chip background/text token pair so contrast is ≥ 4.5:1 in both light and dark themes

### Out of scope (deferred to later Bolts)

- **Bolt 4 (Receipt Generation):** Puppeteer-based PDF receipt template, "Print receipt on delivery" button, receipt template design with shop branding header
- **Bolt 5 (Dashboard & Payment Tracking):** "Pending deliveries" widget, "Outstanding balances" widget, daily/weekly/monthly stats, owner home page
- **Bolt 6 (Polish):** order cancellation/refund, frame brand master data, multi-pair discount handling, audit log (who-changed-what-when), CSV/Excel export, status-timeline as a visual feature

### Explicitly excluded from scope

- Multiple prescriptions per order (two-pair customers create two orders — confirmed in Mob Elaboration #4)
- Inventory tracking (frames in stock, lens reserves) — not in MVP
- Multi-shop / multi-branch — single-shop assumption
- Customer-facing portal (the customer doesn't sign in; only OWNER and WORKER)

## Domain Model

### Prescription

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| customerId | UUID | FK → Customer |
| rightSph | Decimal(4,2) | -20.00 to +20.00, step 0.25, nullable |
| rightCyl | Decimal(4,2) | -6.00 to +6.00, step 0.25, nullable |
| rightAxis | Int | 1–180, nullable (only required when CYL is set) |
| rightAdd | Decimal(4,2) | 0.00 to +4.00, step 0.25, nullable |
| leftSph | Decimal(4,2) | (same as right) |
| leftCyl | Decimal(4,2) | (same as right) |
| leftAxis | Int | (same as right) |
| leftAdd | Decimal(4,2) | (same as right) |
| pd | Int | 50–80 (mm) |
| type | Enum | DISTANCE / NEAR / BIFOCAL / PROGRESSIVE |
| writtenBy | String? | optometrist name (free text, nullable) |
| writtenOn | Date? | when prescription was written (nullable; defaults to today on form) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

**Note on nullables:** any single eye field can be null (one eye may not need correction). Validation: if SPH for an eye is set, all other fields for that eye are valid (0 is an acceptable value). If CYL is set, AXIS must be set. PD is always required.

### Order

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| orderNumber | String | unique, format `ORD-YYYY-NNNN`, generated server-side |
| customerId | UUID | FK → Customer (RESTRICT on delete — cannot delete customer with orders) |
| prescriptionId | UUID | FK → Prescription (CASCADE on delete) |
| frameDescription | String | free text, max 500 chars |
| lensType | String | free text, max 200 chars |
| coatings | String? | free text, max 200 chars, nullable |
| totalAmount | Decimal(10,2) | ≥ 0 |
| status | Enum | CREATED / IN_PROGRESS / READY / DELIVERED |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

**Derived fields (computed at API serialization, not stored):**
- `totalPaid`: sum of `payments.amount` for this order
- `balanceDue`: `totalAmount - totalPaid`
- `isPaidInFull`: `balanceDue <= 0`

### Payment

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| orderId | UUID | FK → Order (CASCADE on delete) |
| amount | Decimal(10,2) | > 0 |
| paidOn | Date | defaults to today |
| method | Enum | CASH / CARD / MOBILE_MONEY |
| note | String? | free text, max 200 chars (nullable) — used for "advance", "balance", "partial 1/3" |
| createdAt | DateTime | auto |

### Validation summary table (referenced in DTOs)

| Field | Min | Max | Step | Required |
|---|---|---|---|---|
| Prescription.SPH | -20.00 | +20.00 | 0.25 | per-eye optional |
| Prescription.CYL | -6.00 | +6.00 | 0.25 | per-eye optional |
| Prescription.AXIS | 1 | 180 | 1 | required if CYL set |
| Prescription.ADD | 0.00 | +4.00 | 0.25 | optional |
| Prescription.PD | 50 | 80 | 1 | always required |
| Order.totalAmount | 0 | (none) | 0.01 | required |
| Payment.amount | 0.01 | (none) | 0.01 | required |

## Resolved Open Questions (from Mob Elaboration)

All ten resolved by user confirmation; recorded here to lock decisions:

1. **Order number format:** `ORD-2026-0001` (year prefix + zero-padded sequence per year). Reset annually.
2. **Status lifecycle:** `CREATED → IN_PROGRESS → READY → DELIVERED`. Forward-only at backend for WORKER; OWNER can override. Payment-paid is a derived flag.
3. **Currency:** PKR, 2 decimal places, `Decimal(10,2)` in DB, frontend formats with `Rs.` prefix and en-PK locale grouping.
4. **Prescription-Order relationship:** 1:1 (one Order = one Prescription). Two-pair customers create two Orders.
5. **PD location:** on Prescription (not Order).
6. **Order create/edit UX:** detail page (`/orders/:id`), not dialog.
7. **Validation ranges:** SPH -20 to +20 step 0.25; CYL -6 to +6 step 0.25; AXIS 1–180; ADD 0 to +4 step 0.25; PD 50–80.
8. **Permissions:** WORKER + OWNER both create/edit/record-payments. OWNER-only: delete order, delete payment, status rollback.
9. **Reference anchors:** Lenskart order detail (primary), Stripe invoice (payment history), Linear issue detail (status timeline).
10. **Scope discipline:** receipt generation → Bolt 4; dashboard widgets → Bolt 5; cancellation/refund + master data → Bolt 6.

## Implementation Plan (numbered, in execution order)

### Phase 1 — Backend foundation (steps 1–10)

1. Add `OrderStatus` and `PaymentMethod` enums + `Prescription`, `Order`, `Payment` models to `optical-backend/prisma/schema.prisma`. Configure FK relationships with correct ON DELETE behavior (Customer→Order = RESTRICT; Order→Prescription = CASCADE; Order→Payment = CASCADE).
2. Generate Prisma migration `add-orders-prescriptions-payments`. Verify migration applies cleanly to a fresh DB.
3. Create `optical-backend/src/orders/` directory with `orders.module.ts`, `orders.controller.ts`, `orders.service.ts`, `dto/` subfolder.
4. Create DTOs: `CreateOrderDto` (with nested `PrescriptionInputDto`), `UpdateOrderDto`, `UpdateOrderStatusDto`, `CreatePaymentDto`. All decorated with `class-validator` rules from the validation table.
5. Implement `OrdersService.generateOrderNumber()` using a Postgres sequence or `Prisma.$transaction` with `MAX(orderNumber)` parsing. Format: `ORD-${year}-${seq.toString().padStart(4, '0')}`.
6. Implement `OrdersService.create()` — transactional: create Prescription, generate order number, create Order with FK, return joined record.
7. Implement `OrdersService.findAll()` — paginated, with optional `q` (orderNumber + customer name search via Prisma `OR`/`contains`/`mode: insensitive`), `status` (array filter), default sort by `createdAt desc`.
8. Implement `OrdersService.findOne()` — eager-load prescription, customer, payments. Compute `totalPaid`, `balanceDue`, `isPaidInFull` in serializer.
9. Implement `OrdersService.update()`, `updateStatus()` (with role check + transition rule), `remove()` (OWNER guard).
10. Implement `OrdersService.recordPayment()` and `removePayment()` (OWNER guard on remove).

### Phase 2 — Backend wiring + tests (steps 11–14)

11. Register `OrdersModule` in `app.module.ts`. Wire role guards.
12. Write e2e tests in `optical-backend/test/orders.e2e-spec.ts` (~22 tests):
    - Create order (happy path with prescription nested) → 201 with order number generated
    - Create order with invalid SPH (out of range) → 400
    - Create order with CYL but no AXIS → 400
    - Create order with PD missing → 400
    - List orders without auth → 401
    - List orders with search by customer name → returns matching
    - List orders filtered by status → returns only that status
    - Get order by ID → 200 with prescription + payments + balance fields
    - Update order frame description as WORKER → 200
    - Update order status forward as WORKER → 200
    - Update order status backward as WORKER → 403
    - Update order status backward as OWNER → 200
    - Delete order as WORKER → 403
    - Delete order as OWNER → 204; prescription + payments cascade-deleted
    - Cannot delete customer with orders → 409 (Conflict — FK RESTRICT)
    - Record payment → 201; balanceDue updates correctly
    - Record payment > balance → 400 (overpayment guard) OR 201 (allowed; balanceDue goes negative — pick one in implementation)
    - Delete payment as WORKER → 403
    - Delete payment as OWNER → 204
    - Order number generation: 3 sequential creates produce ORD-YYYY-0001, 0002, 0003
    - Order number generation: rolls correctly across year boundary (manual test, may skip in e2e)
    - All 14 Bolt 2 customer e2e tests still pass
13. Update Bolt 1 hygiene patch's `app.e2e-spec.ts` to verify it still passes (root 404 assertion).
14. Run `npm run build` and `npm run test:e2e`. Both must be clean.

### Phase 3 — Frontend foundation (steps 15–18)

15. Create `optical-frontend/src/app/pages/orders/` directory. Add three standalone components (all OnPush): `OrdersListComponent`, `OrderCreateComponent`, `OrderDetailComponent`. Add a shared `OrdersService` with HTTP methods returning observables, exposed as signals via `toSignal()`.
16. Define new routes in `app.routes.ts`: `/orders`, `/orders/new`, `/orders/:id`. JWT guards on all three. Add nav link "Orders" in the layout component.
17. Create shared sub-components: `<app-prescription-form>`, `<app-customer-picker>`, `<app-status-badge>`, `<app-payment-history>`, `<app-record-payment-dialog>`, `<app-status-timeline>` (status timeline is stretch).
18. Wire signals + OnPush correctly across all components. Use `toSignal(httpObservable, { initialValue: ... })` everywhere; avoid manual `signal().set()` from HTTP response handlers (the Bolt 2.6 NG0100 pattern).

### Phase 4 — Frontend pages (steps 19–24)

19. Build `OrdersListComponent`: PrimeNG `<p-table>` with columns `orderNumber`, `customerName`, `status` (badge), `totalAmount` (right-aligned, monospaced), `balanceDue` (right-aligned, monospaced), `createdAt`, actions. Search bar above the table. Status filter chips. Paginator. Empty state with illustration matching customers empty-state pattern.
20. Build `OrderCreateComponent`: multi-section form (customer picker → prescription form → frame/lens → totals) with validation feedback. Save button: invokes `OrdersService.create()`, on success navigates to `/orders/:id`.
21. Build `OrderDetailComponent`: header with order number + status badge; customer info card; prescription card; frame/lens card; payment-history card with "Record payment" button; total/paid/balance summary; status transition controls (single button for WORKER, dropdown for OWNER); delete button (OWNER only). Each card uses the brand-gradient + glow tokens from Bolt 2.6.
22. Wire `RecordPaymentDialog` to `OrderDetailComponent`'s "Record payment" button. After save, refresh order signal so balanceDue updates.
23. Apply Bolt 2.6 motion: page-load fade-up stagger on every section in detail page; route transitions on the orders routes; reduced-motion suppresses cleanly.
24. Apply Bolt 2.6 visual treatment: glassmorphic nav (already wired), gradient mesh on detail page header (subtle, not dominant), Geist Mono on all money fields and order numbers, `<app-status-badge>` uses appropriate accent token per status with subtle glow.

### Phase 5 — Bolt 2.6 deferred a11y defects (steps 25–26)

25. **Add/Edit Customer dialog `aria-labelledby` fix.** In the existing customer add/edit dialog, ensure the `<p-dialog>` has `aria-labelledby` pointing at the header element's `id`, OR use `aria-label="Add new customer"` / `aria-label="Edit customer"` as the simplest fix. Re-run Lighthouse on `/customers` to verify the ARIA audit now passes.
26. **Role badge chip contrast fix.** The Bolt 2.5 role-badge tokens that drive the OWNER/WORKER chip on the customers page produce a contrast ratio below WCAG AA in both themes. Adjust either the chip background or chip text token to push the ratio above 4.5:1. Re-run Lighthouse on `/customers` to verify the contrast audit now passes. **Target post-fix: `/customers` light ≥ 25/25 and dark ≥ 25/25.**

### Phase 6 — Gate Evidence verification (steps 27–30)

27. **Direct browser observation pass:**
    - Hard refresh `/orders` → list populates within 2s, table or empty state renders cleanly
    - Click "New order" → `/orders/new` loads, form sections render in order with stagger
    - Fill out a real-looking order (use Ali from Bolt 2 as customer) → save → redirect to `/orders/:id` with all data visible
    - Navigate from detail back to list → status updates and balance reflect what was saved
    - Test edge cases: customer with no prescription history (empty picker state), order with overpayment (if backend allows), payment delete by OWNER vs WORKER
    - DevTools Console clean throughout (zero NG0100, zero other errors)
    - DevTools Network clean (every request 200/201/204 or expected 4xx; no 500s)

28. **Lighthouse Accessibility (Snapshot mode, all ≥ 95):**
    - `/orders` light, dark
    - `/orders/new` light, dark
    - `/orders/:id` light, dark
    - `/customers` light, dark (re-audit after a11y fixes — must hit ≥ 25/25)
    - All 8 audits captured into `docs/screenshots/bolt-3/`

29. **Lighthouse Performance (Navigation mode, production build via `npx serve -s` on `:4300`, must hold ≥ 96 baseline):**
    - `/customers` (regression check) → ≥ 96
    - `/orders` → ≥ 96 (or document why slightly lower is acceptable, e.g. richer table)
    - `/orders/:id` (with one fully-populated order) → ≥ 96 (or document)
    - All 3 audits captured into `docs/screenshots/bolt-3/`

30. **`prefers-reduced-motion` emulation:** verify on `/orders`, `/orders/new`, `/orders/:id` that all motion suppresses cleanly with content still visible. One screenshot of `/orders/:id` under reduced-motion → `docs/screenshots/bolt-3/reduced-motion-order-detail.png`.

## Gate Evidence Checklist

Standing items (carried from Bolts 2.5 and 2.6):

- [ ] `ng build` compiles clean
- [ ] All 14 Bolt 2 customer e2e tests still pass (no regression)
- [ ] Bolt 1 hygiene `app.e2e-spec.ts` (root 404 assertion) still passes
- [ ] All new components use `ChangeDetectionStrategy.OnPush`
- [ ] Direct browser observation pass (Console + Network + DOM clean across all new pages)
- [ ] Lighthouse Accessibility ≥ 95 on every new page in both themes (×6 audits) + `/customers` re-audit at 25/25 in both themes (×2 audits) — total 8 screenshots
- [ ] Lighthouse Performance Navigation production build ≥ 96 on `/orders` and `/orders/:id` (×2 audits, +1 regression check on `/customers`) — total 3 screenshots
- [ ] `prefers-reduced-motion` emulation pass on all new pages
- [ ] `/customers` Add/Edit dialog has accessible name (Bolt 2.6 deferred defect resolved)
- [ ] `/customers` role badge chip contrast ≥ WCAG AA in both themes (Bolt 2.6 deferred defect resolved)

Bolt 3-specific items:

- [ ] Order CRUD endpoints work end-to-end with role enforcement
- [ ] Order number generation produces sequential `ORD-YYYY-NNNN` strings, atomic under concurrent creates
- [ ] Prescription validation rejects out-of-range values per the validation table
- [ ] Status transition rules enforced (WORKER forward-only, OWNER anywhere)
- [ ] Cannot delete customer who has orders (FK RESTRICT, returns 409)
- [ ] Cascade delete works correctly: deleting an order removes its prescription and all payments
- [ ] Payment recording updates `balanceDue` and `isPaidInFull` correctly
- [ ] At least 22 e2e tests in `orders.e2e-spec.ts`, all passing
- [ ] `/orders` list searchable by orderNumber + customer name
- [ ] `/orders` list filterable by status (multi-select chips)
- [ ] Money fields right-aligned, Geist Mono, "Rs." prefix, en-PK grouping
- [ ] Prescription form rendered as 2-column right-eye / left-eye grid (not flat list)
- [ ] Status badge uses appropriate accent token per status (visual differentiation, not just text)
- [ ] Empty state for orders list uses illustrated empty-state pattern from Bolt 2.6
- [ ] Customer picker on order create allows typeahead from existing customers + inline "Add new customer"

Anti-generic checks (informal eyeball, screenshot for retro):

- [ ] Order detail page has visual hierarchy with section cards, not a flat form
- [ ] Status badge looks like a real branded chip, not flat PrimeNG default
- [ ] Money fields look like a real receipt, not a generic admin form
- [ ] Prescription form 2×4 grid feels like the handwritten card it replaces

## Reference Anchors (look at these during ambiguity)

- **Lenskart order detail page** — order status, prescription rendering, lens/coating fields
- **Stripe invoice detail page** — line item + payment history pattern, money-field rendering
- **Linear issue detail** — status badge gravitas, audit trail, side panel layout
- **A real Pakistani optical-shop handwritten card** (the actual physical artefact) — for prescription field layout and the "card" metaphor

## Risks (called out so the kickoff prompt can plan around them)

- **Order number generation under concurrent creates.** Two staff create orders at the same instant → both compute `MAX(orderNumber)+1` and collide on the unique constraint. Mitigation: use a Postgres sequence (`CREATE SEQUENCE order_number_2026 START 1`) or wrap the generation in a serializable transaction. The simpler path is the sequence; allocate one sequence per year, switch sequence on year rollover.
- **Decimal precision drift.** JS `number` is float; money in float is forbidden. Use Prisma's `Decimal` type, accept strings in DTOs, validate as `IsDecimal({ decimal_digits: '0,2' })`. Frontend should treat money as strings or `Decimal.js`, not `number`.
- **Customer-with-orders deletion.** Bolt 2's customer delete probably uses cascade or no FK behavior. Bolt 3 must change this to RESTRICT and ensure the existing customer-delete e2e test is updated to handle the 409 case.
- **Prescription fields are partially nullable.** A customer might need correction in only one eye. The form must allow leaving an entire eye blank without failing validation.
- **Owner-vs-Worker status transition.** WORKER cannot roll back; OWNER can. Backend enforces, frontend hides the dropdown for WORKER. Both layers must agree.
- **Money field UX in PrimeNG.** PrimeNG `<p-inputnumber>` with `mode="currency" currency="PKR" locale="en-PK"` may produce unexpected output (PKR is unusual). Test in browser early; fall back to plain numeric input with custom formatting if PrimeNG behavior is wrong.

## Estimated Construction Profile

- **Conservative wall-clock:** 50–70 minutes main run; 1–2 patches (15–25 min each); total Bolt time **1.5–2 hours**.
- **Realistic prompt count:** 1 main kickoff + 2 patches = **3 prompts**.
- **LOC generated:** ~1800–2500 (backend ~900–1200; frontend ~900–1300).
- **Tests added:** ~22 new e2e tests + the 14 Bolt 2 tests still passing.
- **Plan-vs-actual sanity check:** if main construction comes in under 30 minutes, treat as suspicious — Bolt 2.6 taught us that "fast main run" correlates with skipped work that surfaces as visual or functional defects later.

## Estimated Traditional Baseline

A senior full-stack developer working manually would need roughly **40–55 hours** to deliver Bolt 3:

- Schema design + migrations + FK rules + Prisma adapter handling: ~3–4h
- NestJS modules with three resources, DTOs, validation, guards, role enforcement, status-transition rules: ~10–14h
- Order number generation under concurrency: ~1–2h
- 22 e2e tests with supertest covering the matrix above: ~6–8h
- Three Angular pages with OnPush + signals discipline: ~10–14h
- Customer picker, prescription 2×4 grid, status badge, payment dialog: ~4–6h
- Money handling end-to-end with PrimeNG quirks: ~2–3h
- Manual a11y + Lighthouse audits + the two `/customers` deferred defects fixed: ~2–3h
- Bug-fix loop equivalent to the 1–2 patches we expect: ~2–3h

**40 hours conservative; 55 hours realistic. Actual Bolt 3 expected: 1.5–2 hours. Speedup target: ~20–35×.**

This is **lower** than Bolts 2 / 2.6 deliberately. The honest case-study claim is "AI-DLC delivers a marquee domain feature with three new entities, twelve endpoints, and three full pages at ~25× when the foundation is already in place." Anything higher than ~30× is suspicious and should be re-examined for skipped work.

## Kickoff Prompt (paste into a fresh Mob Construction session when ready)

```
Begin Bolt 3 — Order + Prescription Entry on a new branch
bolt/3-orders-prescriptions forked from main.

Read these documents in full before touching any code:
1. docs/bolt-plans/bolt-3.md   (THIS plan — your source of truth)
2. docs/ai-dlc-methodology.md  (the methodology — why we work this way)
3. docs/scope.md               (project intent + DDD model)
4. docs/bolt-retros/bolt-2.6.md  (most recent retro — methodology lessons land here)

You are doing Mob Elaboration + Mob Construction back-to-back. The plan
above has all open questions resolved (see "Resolved Open Questions"
section); do not re-elaborate them. The plan also has a 30-step
Implementation Plan and a Gate Evidence checklist; follow them.

NON-NEGOTIABLE CONSTRAINTS (from Bolt 2.6 retro lessons):

1. Every new standalone component uses ChangeDetectionStrategy.OnPush.
   Do not skip this. OnPush is the default, not the optimization.

2. Every HTTP-derived signal is created via toSignal(observable,
   { initialValue: ... }). Do not manually .set() signals from
   subscribe handlers. (This is the Bolt 2.6 NG0100 lesson.)

3. Money values are NEVER stored or computed as JS number. Use string
   on the wire, Prisma.Decimal in the DB, en-PK locale formatting in
   the UI.

4. Order number generation must be safe under concurrent creates.
   Postgres sequence per year is the recommended approach.

5. The two deferred /customers a11y defects from Bolt 2.6 ARE part of
   this Bolt's Gate Evidence (steps 25–26). Do not skip them.

6. Direct browser observation (Console + Network + DOM) is mandatory
   Gate Evidence on every new page. "Tests pass + ng build clean" is
   not sufficient evidence — Bolt 2.6 had 6 defects that passed both
   gates and only direct browser inspection caught them.

7. Plan-vs-actual wall-clock sanity check: if your main construction
   completes in under 30 minutes, STOP and visually verify every page
   in a browser before declaring done. Bolt 2.6 taught us that fast
   completion correlates with skipped visual work.

REQUIRED SUMMARY at the end:

1. Schema changes (Prisma + migration name)
2. New backend modules + endpoints (count + list)
3. New frontend routes + components (count + list)
4. e2e test count and pass/fail breakdown
5. ng build output (last 5 lines)
6. Direct browser observation results for /orders, /orders/new,
   /orders/:id (3 pass/fail items each: list populates? form submits?
   detail loads with all data? — 9 items total)
7. Bolt 2.6 deferred a11y defects status (2 named items: pass/fail)
8. Wall-clock time
9. Prompt count this session
10. Any deviations from the plan with rationale
```

## Notes for the Retro (to be written after Bolt 3 ships)

Capture during construction so the retro doesn't have to reconstruct from memory:

- Plan-vs-actual time per phase (backend foundation, backend tests, frontend foundation, frontend pages, deferred a11y, Gate Evidence)
- Any plan-step that needed to be re-ordered during construction (and why)
- Any place where the model self-corrected (Bolt 2.6 had the `geist` package self-correct)
- Any place where the model deviated from the plan with an upgrade (Bolt 2.6 had the transform-translate vs background-position upgrade)
- The actual Lighthouse Performance Navigation production score for `/orders` — does it hold the ≥96 baseline?
- The number of e2e tests actually shipped vs the 22 target
- Any "tests pass but UI broken" pattern occurrences (this is the fourth Bolt — does the pattern continue?)
- The actual wall-clock for the patch loop, if patches happen
