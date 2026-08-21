# ClientFlow — Client Management & AI Automation Platform

Next.js 14 · TypeScript · Tailwind CSS · PostgreSQL · Prisma · n8n · AI

---

## Project status

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Foundation: config, database, app shell, security baseline | ✅ Done |
| 2 | Authentication (register, login, middleware, RBAC) | ⬜ Next |
| 3 | Public site + lead capture | ⬜ |
| 4 | Admin dashboard + lead management | ⬜ |
| 5 | Clients, Projects, Tasks | ⬜ |
| 6 | Client portal | ⬜ |
| 7 | AI qualification + notifications | ⬜ |
| 8 | n8n automation | ⬜ |
| 9 | Reports + audit logs | ⬜ |
| 10 | Hardening, tests, Vercel deploy | ⬜ |

---

## Requirements

- Node.js 18+ (this project was set up with v24.19.0)
- PostgreSQL 17 running locally
- Git

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
copy .env.example .env      # Windows
# then edit .env and set DATABASE_URL and JWT_SECRET

# 3. Create the database tables
npm run db:migrate

# 4. Add starter accounts
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

---

## Development accounts

Created by `npm run db:seed`. **Development only — change before production.**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@clientflow.local` | `Admin123!` |
| Project Manager | `manager@clientflow.local` | `Manager123!` |
| Team Member | `member@clientflow.local` | `Member123!` |
| Client | `client@clientflow.local` | `Client123!` |

> Login pages arrive in Phase 2. For now these accounts just prove the database works.

---

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check, no build output |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (used in production) |
| `npm run db:seed` | Insert starter accounts |
| `npm run db:studio` | Open Prisma Studio, a visual database browser |
| `npm run db:reset` | ⚠️ Wipe the database and re-run all migrations |

---

## Project structure

```
prisma/
  schema.prisma      Database models and enums
  seed.ts            Starter accounts
src/
  app/
    layout.tsx       Root layout (wraps every page)
    page.tsx         Home / system status
    loading.tsx      Global loading state
    error.tsx        Global error boundary
    not-found.tsx    404 page
    globals.css      Tailwind + theme utilities
  components/
    ui/              Reusable presentational components
  lib/
    env.ts           Validates environment variables at startup
    prisma.ts        Database client (singleton)
    auth.ts          Password hashing, JWT sessions, role guard
    ai.ts            Lead qualification (AI + rules fallback)
    audit.ts         Audit log writer
    utils.ts         cn() class helper, date formatting
```

---

## Security notes

- `.env` is git-ignored. **Never commit it.**
- `JWT_SECRET` is validated at startup (minimum 32 characters). The app refuses
  to boot without it — there is deliberately no insecure fallback.
- Secrets are only read in server code. Only `NEXT_PUBLIC_*` variables reach the
  browser, and none of those are sensitive.
- Security headers are set in `next.config.js`.
- Authorization is enforced server-side via `requireAuthSession()`. Hiding a
  button in the UI is never treated as a security control.
