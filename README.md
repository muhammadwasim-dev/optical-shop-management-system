# Optical Shop Management System

A digital replacement for the handwritten customer cards used in optical shops. Built as a real-world case study in **AI-Driven Development Lifecycle (AI-DLC)** — replacing Agile sprints with outcome-defined Bolts, AI-assisted Mob Construction, and gated evidence-based delivery.

## Project Intent

Enable optical shop owners and staff to digitally manage customer records, eye prescriptions, and orders — replacing paper cards with a searchable, role-aware system that tracks payments, generates printable receipts, and gives the owner real-time visibility into pending deliveries and outstanding balances.

Full scope: [`docs/scope.md`](docs/scope.md)

## Why This Project Exists

This is both a working MVP for a real target user (neighborhood optical shops still using handwritten cards) and a public record of how AI-DLC compares to traditional SDLC in practice. Every Bolt is tracked with actual metrics (clock hours, prompt count, lines of code, gate failures) so the productivity claims made in the final case study are grounded in data, not impressions.

Methodology write-up: [`docs/ai-dlc-methodology.md`](docs/ai-dlc-methodology.md)
Per-Bolt metrics: [`docs/metrics-tracker.md`](docs/metrics-tracker.md)
Retros: [`docs/bolt-retros/`](docs/bolt-retros/)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17+, PrimeNG, standalone components |
| Backend | NestJS, Passport.js, JWT |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT with role-based guards (OWNER / WORKER) |
| PDF (planned) | Puppeteer |

## Bolts Progress

Each Bolt is an independently shippable unit of work with its own Gate Evidence checklist.

- [x] **Bolt 1** — Foundation & Auth
- [x] **Bolt 2** — Customer Management
- [ ] **Bolt 3** — Order + Prescription Entry
- [ ] **Bolt 4** — Receipt Generation
- [ ] **Bolt 5** — Dashboard & Payment Tracking
- [ ] **Bolt 6** — Role Permissions & Polish

Bolt details and Gate Evidence checklists: [`docs/scope.md`](docs/scope.md)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### Backend

```bash
cd optical-backend

# 1. Copy env file and set your DB password
cp .env.example .env

# 2. Apply DB migrations
npx prisma migrate dev --name init

# 3. Start the API
npm run start:dev
```

API runs at `http://localhost:3000`.
Owner account auto-seeded: **username: `owner` / password: `owner123`**.

### Frontend

```bash
cd optical-frontend
ng serve
```

App runs at `http://localhost:4200`.

## Repository Layout

```
Optical Shop Management System/
├── README.md                     ← this file
├── docs/
│   ├── scope.md                  ← Intent, DDD model, Bolts breakdown
│   ├── ai-dlc-methodology.md     ← how AI-DLC is applied here
│   ├── metrics-tracker.md        ← per-Bolt hours, prompts, LOC
│   └── bolt-retros/
│       ├── TEMPLATE.md
│       ├── bolt-1.md
│       └── bolt-2.md
├── optical-backend/              ← NestJS + Prisma + PostgreSQL
└── optical-frontend/             ← Angular + PrimeNG
```

## About

Built by [Muhammad Wasim](https://linkedin.com/in/muhammadwasim-dev) as a public case study in AI-assisted software delivery. Open to remote Senior Software Engineer roles (UTC+5, full overlap with GMT, partial overlap with EST).
