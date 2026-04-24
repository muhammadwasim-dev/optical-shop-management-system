# optical-backend

NestJS + Prisma + PostgreSQL API for the Optical Shop Management System.

Part of the [Optical Shop Management System](../README.md) project — see the root README for the full project Intent, AI-DLC methodology, and Bolts roadmap.

## Module Overview

```
src/
├── main.ts                  ← bootstrap, CORS for Angular
├── app.module.ts            ← root module
├── prisma/
│   ├── prisma.module.ts     ← global Prisma module
│   └── prisma.service.ts    ← PrismaClient wrapper
└── auth/
    ├── auth.module.ts
    ├── auth.controller.ts   ← POST /auth/login
    ├── auth.service.ts      ← bcrypt + JWT sign, Owner seeding
    ├── jwt.strategy.ts      ← Passport JWT strategy
    ├── jwt-auth.guard.ts
    ├── roles.guard.ts
    ├── roles.decorator.ts   ← @Roles(Role.OWNER)
    └── dto/login.dto.ts
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 14+ running locally (or a reachable remote)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and set your DB password + JWT secret
cp .env.example .env

# 3. Apply migrations
npx prisma migrate dev --name init

# 4. Start in dev mode
npm run start:dev
```

The server listens on `http://localhost:3000`.

On first boot, the auth service seeds an Owner account:
- username: `owner`
- password: `owner123`

Change this password as soon as real data enters the system.

## Environment Variables

See `.env.example`. At minimum:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens (use a long random string in production) |

## API Surface (Bolt 1)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | none | Exchange username + password for a JWT |

Additional endpoints are added in subsequent Bolts — see [`../docs/scope.md`](../docs/scope.md).

## Database

Schema managed by Prisma — see [`prisma/schema.prisma`](prisma/schema.prisma).

Current models:

- `User` — id, name, username, password (bcrypt hash), role (OWNER | WORKER), createdAt

## Available Scripts

```bash
npm run start        # production mode
npm run start:dev    # dev mode with watch
npm run start:prod   # run compiled build

npm run build        # TypeScript build
npm run lint         # ESLint
npm run format       # Prettier

npm run test         # unit tests
npm run test:e2e     # end-to-end tests
npm run test:cov     # coverage
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWTs expire after 8 hours (configured in `auth.module.ts`)
- `.env` must never be committed — it is gitignored
- CORS is enabled in `main.ts` for the Angular dev origin; restrict in production

## License

Project is a private educational / portfolio project. Not licensed for external use.
