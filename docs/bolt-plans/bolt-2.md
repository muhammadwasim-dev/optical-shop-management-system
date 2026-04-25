# Bolt 2 Plan — Customer Management

*Branch:* `bolt/2-customer-management`
*Depends on:* Bolt 1 (Foundation & Auth) — complete

## Intent (Bolt-level)

Enable any authenticated user to create, view, search, and edit customer records. Only Owners can delete a customer. Every customer action is auditable through `createdAt` and `updatedAt` timestamps.

## Scope

### In scope
- `Customer` aggregate in Prisma schema
- Migration to add `customers` table
- REST CRUD endpoints under `/customers`
- Server-side search by name or contact (query param `?search=...`)
- Role-gated DELETE (OWNER only)
- Angular feature module at `pages/customers/`
- PrimeNG table with search input, add/edit dialog, confirm-delete dialog
- Seed a WORKER account (`worker` / `worker123`) alongside the existing OWNER seed — needed to verify role behavior
- Integration tests for every endpoint (happy path + primary error case minimum)

### Out of scope for Bolt 2 (explicit non-goals)
- Orders tab on customer detail → Bolt 3
- Prescription history tab → Bolt 3
- Payment history → Bolt 5
- Soft delete / archival → post-MVP
- Pagination (MVP can use in-memory list; revisit if a single shop exceeds ~500 records)
- Customer photo / file attachments → post-MVP

## Domain Model Delta

Adds one aggregate root to the Customer bounded context.

```
model Customer {
  id        String   @id @default(uuid())
  name      String
  contact   String
  address   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Notes:
- `contact` stored as free-text string for MVP (phone formats vary). No validation beyond "not empty". A formal `phone` value object may be introduced in a later refactor.
- `address` is nullable — some walk-in customers don't leave an address.
- No foreign keys yet; `Order` (Bolt 3) will reference `Customer.id`.

## Gate Evidence Checklist

Write this checklist into the PR description. A Bolt is not merged until every box is checked.

### Backend

- [ ] `npx prisma migrate dev --name add-customer` applies cleanly
- [ ] `customers` table exists in PostgreSQL with expected columns and indexes
- [ ] `POST /customers` with valid body returns 201 and the created row
- [ ] `POST /customers` with missing `name` returns 400 with a validation error message
- [ ] `POST /customers` without `Authorization` header returns 401
- [ ] `GET /customers` returns an array of customer records
- [ ] `GET /customers?search=<q>` returns only customers whose `name` OR `contact` contains `q` (case-insensitive)
- [ ] `GET /customers/:id` returns the customer when found
- [ ] `GET /customers/:id` returns 404 for a well-formed but unknown UUID
- [ ] `PATCH /customers/:id` updates only provided fields and returns the updated row
- [ ] `DELETE /customers/:id` as OWNER removes the row and returns success
- [ ] `DELETE /customers/:id` as WORKER returns 403
- [ ] WORKER account seeded on first boot alongside OWNER
- [ ] At least one integration test per endpoint (happy + primary error) passes via `npm run test:e2e`

### Frontend

- [ ] `/customers` route renders behind `authGuard`
- [ ] Route is reachable from a "Customers" link in the top nav
- [ ] PrimeNG DataTable shows columns: Name, Contact, Address, Created
- [ ] Search input filters the list (debounced ~300ms, hits backend `?search=`)
- [ ] "Add Customer" button opens a PrimeNG Dialog with a reactive form
- [ ] Form validates `name` (required) and `contact` (required) inline
- [ ] Successful add shows a PrimeNG Toast and refreshes the list
- [ ] Clicking a row opens the Edit dialog pre-filled with the customer
- [ ] Edit saves and refreshes the list
- [ ] Delete button renders ONLY when `auth.getRole() === 'OWNER'`
- [ ] Delete button triggers a PrimeNG ConfirmDialog; confirming removes the row
- [ ] No console errors on any of the above screens

### End-to-End Journey

- [ ] Log in as `owner / owner123` → click Customers → add "Ali Khan" with contact "0300-1234567" → search "Ali" → row appears → click row → edit contact → save → search again → updated contact shown → delete → row removed
- [ ] Log in as `worker / worker123` → click Customers → add "Fatima Ahmed" → search "Fatima" → edit address → save → confirm **no delete button** is visible on any row

## Implementation Plan

### Backend steps (in order)

1. Update `prisma/schema.prisma` — add `Customer` model
2. Run `npx prisma migrate dev --name add-customer`
3. Generate Nest resource: `nest g module customers`, `nest g controller customers`, `nest g service customers` (or hand-scaffold — either is fine, the Bolt 1 pattern used hand-scaffolding)
4. Create DTOs: `CreateCustomerDto`, `UpdateCustomerDto` with `class-validator` decorators
5. Wire `CustomersController` with `@UseGuards(JwtAuthGuard)` on all methods, plus `@UseGuards(RolesGuard)` + `@Roles(Role.OWNER)` on DELETE
6. Implement service methods using `PrismaService`: `create`, `findAll(search?)`, `findOne(id)`, `update`, `remove`
7. Extend `AuthService.seedOwner()` to also seed a Worker account (rename to `seedUsers()`)
8. Register `CustomersModule` in `AppModule`
9. Write integration tests in `test/customers.e2e-spec.ts`

### Frontend steps (in order)

1. Generate feature folder: `src/app/pages/customers/`
2. Create `customer.model.ts` with the Customer interface
3. Create `customer.service.ts` — wraps `HttpClient` for the 5 endpoints, returns RxJS observables
4. Create `customer-list.component.ts` — PrimeNG Table + search input (debounced)
5. Create `customer-form.component.ts` — reactive form, used inside dialog for both create and edit
6. Add delete confirmation using `ConfirmationService` + `ConfirmDialog`
7. Add route `{ path: 'customers', loadComponent: ... }` in `app.routes.ts`
8. Add "Customers" item to `layout.component` nav
9. Wire PrimeNG `ToastModule` + `MessageService` in `app.config.ts` for success/error toasts

### Testing approach

- Backend: `@nestjs/testing` + `supertest` hitting a test PostgreSQL database (or `prisma-mock` if you want no-DB tests). Use a single test file: `test/customers.e2e-spec.ts`.
- Frontend: Skip unit tests for now (aligned with MVP priority) but ensure no console errors during the E2E Journey walk-through. Add Playwright or Cypress in a later Bolt.

## Estimated Effort

Based on Bolt 1's 40-minute baseline and Bolt 2's additional scope (integration tests + more UI surface):

| Phase | Estimate |
|---|---|
| Mob Elaboration (clarify open questions, confirm plan) | 5 min |
| Backend Mob Construction (schema, migration, module, service, controller, DTOs, tests) | 20–30 min |
| Frontend Mob Construction (service, list, form dialog, route, nav) | 25–35 min |
| Gate Evidence walk-through | 10 min |
| Retro + metrics update | 5 min |
| **Total** | **65–85 min** |

A traditional estimate for the same scope: ~14–18 hours.

## Risks and Open Questions

Resolve in the first 2 minutes of Mob Elaboration, before any code is written:

- **Search: server-side or client-side?** Plan says server-side (`?search=`). If the dataset is tiny (<200 rows) client-side is simpler; server-side is forward-compatible with pagination in Bolt 5.
- **Update semantics: PATCH or PUT?** Plan says PATCH (partial update). Confirm.
- **Address trimming / casing?** Plan: store as-is, trim whitespace at DTO validation layer.
- **Should `createdAt` / `updatedAt` be exposed in list response?** Plan: yes (`Created` column is in the table spec). `updatedAt` used internally only for now.

## What Changes vs Bolt 1 (Process)

Per the Bolt 1 retro:

1. ✅ Gate Evidence written **before** any code (this document)
2. ✅ Integration tests required as Gate Evidence, not deferred
3. ✅ Plan includes explicit delete/skip of boilerplate files
4. ☐ Track prompts + clock time live during the Bolt (keep `docs/bolt-retros/bolt-2-scratch.md` open and log as you go)
