# 28 — Existing System Audit & n8n Integration Readiness

Audit date: 2026-08-24
Scope: full repository inspection prior to any n8n implementation work. No code was changed to produce this report.

> **Update — 2026-08-24, Prompt 29:** the foundation described as MISSING in
> sections 10, 11, and 13 below has now been built. See
> [Implementation Status](#implementation-status) at the end of this
> document for what changed, and
> [`docs/n8n-integration.md`](./n8n-integration.md) for full architecture,
> payload, and configuration details. The findings below are left exactly as
> originally written — they're the "before" picture this work was measured
> against.

---

## 1. Technology Stack

| Layer | Technology | Status |
|---|---|---|
| Framework | Next.js 14.2.8 (App Router, `src/app`) | IMPLEMENTED |
| Language | TypeScript 5.5 | IMPLEMENTED |
| Styling | Tailwind CSS 3.4 | IMPLEMENTED |
| Database | PostgreSQL (Neon serverless, provisioned via Vercel integration) | IMPLEMENTED |
| ORM | Prisma 5.19 (`@prisma/client`) | IMPLEMENTED |
| Auth | Custom JWT (`jose`) in an httpOnly cookie + `bcryptjs` password hashing | IMPLEMENTED |
| Validation | Zod, one schema per form/action in `src/lib/validations/` | IMPLEMENTED |
| Email | Abstraction in `src/lib/email.ts` — no provider wired up, logs to console | PARTIALLY IMPLEMENTED |
| AI | OpenAI Chat Completions call with a deterministic rules-engine fallback (`src/lib/ai.ts`) | IMPLEMENTED (fallback mode; no key set in `.env`) |
| Automation | Outbound-only webhook caller (`src/lib/n8n.ts`) | PARTIALLY IMPLEMENTED |
| Hosting | Vercel (confirmed via `.vercel/`, `VERCEL_*` env vars, `.env.production.local`) | IMPLEMENTED |
| Deployed URL | https://ai-automation-project-eight.vercel.app/ | IMPLEMENTED |

This is **not** a Next-Auth / Supabase / Firebase project, and it does **not** use tRPC or a separate API server — every "backend" call is either a Next.js **Server Action** (`src/lib/actions/*.ts`) or a Next.js **Route Handler** (`src/app/api/**/route.ts`). This matters for n8n: most business logic today has no HTTP endpoint at all, because Server Actions aren't reachable from outside the React app.

---

## 2. Database

**Provider:** PostgreSQL via **Neon** (serverless Postgres). Two Neon projects exist in the Vercel env (`automation_*` and `clientautomation_*` prefixed vars), plus a plain `DATABASE_URL` used by Prisma directly (`prisma/schema.prisma` reads `env("DATABASE_URL")`).

**Connection method:** `src/lib/prisma.ts` — a singleton `PrismaClient`, standard Next.js dev-hot-reload-safe pattern.

**Migration method:** `prisma migrate` (`db:migrate`, `db:deploy`), schema-first via `prisma/schema.prisma`. No raw SQL migrations found outside Prisma's generated ones.

### Models (actual names from `prisma/schema.prisma`)

| Model | Purpose | Primary Key | Key Foreign Keys |
|---|---|---|---|
| `User` | All logins (admin, PM, team member, client) | `id` (uuid) | — |
| `Client` | Business/company record | `id` (uuid) | `userId` → User (optional, `SetNull`), `convertedFromLeadId` → Lead (optional, unique) |
| `Lead` | Inbound inquiry | `id` (uuid) | `assignedToId` → User, `clientId` → Client |
| `LeadNote` | Internal notes on a lead | `id` (uuid) | `leadId` → Lead (Cascade), `authorId` → User |
| `Project` | A client engagement | `id` (uuid) | `clientId` → Client (Cascade, **required**), `managerId` → User, `originatingLeadId` → Lead (unique) |
| `Milestone` | Checkpoints inside a project | `id` (uuid) | `projectId` → Project (Cascade) |
| `ProjectMessage` | Client ⇄ team messages per project | `id` (uuid) | `projectId` → Project (Cascade), `authorId` → User |
| `Task` | Work item inside a project | `id` (uuid) | `projectId` → Project (Cascade, required), `assigneeId`/`creatorId` → User |
| `Notification` | In-app notification for one user | `id` (uuid) | `userId` → User (Cascade) |
| `AutomationRun` | Log of every n8n trigger attempt | `id` (uuid) | none (denormalized `entityType`/`entityId`) |
| `AuditLog` | System action log | `id` (uuid) | `userId` → User (SetNull) |
| `VerificationToken` | Password reset / email verify tokens | `id` (uuid) | `userId` → User (Cascade) |

### Mapping to the entities requested in this audit

| Requested entity | Actual model | Notes |
|---|---|---|
| Client | `Client` | IMPLEMENTED |
| Project | `Project` | IMPLEMENTED |
| Task | `Task` | IMPLEMENTED |
| **Project Update** | **No dedicated model** | There is no `ProjectUpdate` table. "Updates" are currently synthesized on read from `Task.updatedAt` (see `src/lib/services/client/projects.ts`, `recentUpdates`) plus `ProjectMessage` (client↔team messages) and `Milestone` (checkpoint completion). This is a real gap — see §13 and §6. MISSING as a first-class entity. |
| Lead | `Lead` | IMPLEMENTED |
| User | `User` | IMPLEMENTED |
| Notification | `Notification` | IMPLEMENTED, in-app only (no email/push delivery — see §8) |

---

## 3. Authentication

**IMPLEMENTED.** Custom JWT auth, not a third-party auth provider:

- `src/lib/auth.ts` — `hashPassword`/`comparePassword` (bcrypt), `signJWTToken`/`verifyJWTToken` (`jose`, HS256), `setAuthCookie`/`clearAuthCookie` (httpOnly, `sameSite: lax`, `secure` in production).
- `src/middleware.ts` — Edge-runtime, coarse path-prefix RBAC gate (`/admin`, `/manager`, `/client`) using a hand-rolled `jose` verify (middleware can't import `auth.ts` because that pulls in `next/headers`).
- `src/lib/authorization.ts` / `src/lib/admin-guard.ts` / `src/lib/client-guard.ts` — the real, per-request authorization layer that runs in Node (not Edge) and re-checks resource ownership (e.g., "is this client's own project").
- Account lockout: `failedLoginAttempts` / `lockedUntil` on `User`, enforced in the login route.
- API routes: `POST /api/auth/login`, `logout`, `forgot-password`, `reset-password`, `verify-email` — all in `src/app/api/auth/`.

**Gap for n8n:** there is **no API-key / bearer-token / service-account auth mechanism**. The only server-to-server credential that exists is `N8N_WEBHOOK_SECRET`, and it is only used **outbound** (app → n8n, as a header the app sends). There is nothing that lets **n8n call back into this app** and be authenticated — no inbound webhook secret check exists anywhere in `src/app/api/`. This is required before any inbound n8n webhook route can be built safely. See §13.

---

## 4. Client Management

**IMPLEMENTED** (read/list only from services perspective — no direct "create client" form was found; clients are created via **lead conversion**).

- `src/lib/services/admin/clients.ts` — `getClients` (paginated, searchable), `getClientOptions`.
- `src/app/admin/clients/page.tsx` — admin list view.
- `convertLeadToClient()` in `src/lib/services/admin/leads.ts` (line 254) — the actual client-creation path, turning a won/qualified `Lead` into a `Client` (and optionally a `User` portal login).
- Client portal: `src/app/client/` — dashboard (`src/lib/services/client/dashboard.ts`) and project detail (`src/lib/services/client/projects.ts`).

No `CLIENT_CREATED` (or "client converted") event currently triggers `triggerN8nWebhook` — see §11.

---

## 5. Lead Management

**IMPLEMENTED**, the most complete module in the system.

- Public capture: `POST /api/leads` (`src/app/api/leads/route.ts`) → `createLeadFromPublicForm()` in `src/lib/services/leads.ts`. Includes CSRF same-origin check, IP rate limiting (5/hour), honeypot field, 24-hour duplicate detection, and fires `LEAD_CREATED` to n8n.
- Admin management: `src/lib/services/admin/leads.ts` — status changes (`LEAD_STATUS_CHANGED` audit event, **not** sent to n8n), assignment, notes (`LeadNote`), AI qualification (`qualifyLead()` → `qualifyLeadAI()`), conversion to client, conversion to project.
- AI qualification (`src/lib/ai.ts`): calls OpenAI if `OPENAI_API_KEY` is set, else a deterministic keyword/heuristic scoring engine. Never overrides a lead already past `NEW`/`CONTACTED`.
- Fields already on `Lead` specifically for n8n: `n8nSyncedAt`, `n8nExecutionId` — present in the schema but **never written to anywhere in the codebase** (grep confirms no assignment). This is a stub for future use, not a working feature. PARTIALLY IMPLEMENTED.

---

## 6. Project Management

**IMPLEMENTED.**

- `src/lib/services/admin/projects.ts` — create/update/assign manager/assign client/change status. Create fires `PROJECT_CREATED` to n8n (also fired from the lead→project conversion path in `admin/leads.ts`).
- `src/lib/services/project-progress.ts` — `computeProjectProgress()`: once a project has tasks, progress = `completed/total` task ratio; before that, the manually-set `Project.progress` value is used. Single shared rule used by both admin and client views.
- `Milestone` model exists and is shown on the client portal (`src/app/client/projects/[id]/page.tsx`) but there is **no admin UI to create/edit milestones** found anywhere in `src/app/admin/` or `src/lib/actions/admin-projects.ts` — the model and read path exist, the write path does not. PARTIALLY IMPLEMENTED.
- No `PROJECT_STATUS_CHANGED`, `PROJECT_DEADLINE_APPROACHING`, or `PROJECT_UPDATED` event is sent to n8n.

---

## 7. Task Management

**IMPLEMENTED** for CRUD; **NOT connected to automation at all**.

- `src/lib/services/admin/tasks.ts` — full create/update/delete, in-app notification to the assignee on creation/reassignment, audit logging (`TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`).
- Confirmed by direct grep: `triggerN8nWebhook` is **never imported or called** from `admin/tasks.ts`. No `TASK_CREATED` or `TASK_STATUS_CHANGED` event reaches n8n today.
- No overdue-task detection exists anywhere (no cron, no scheduled Vercel function, no `vercel.json` at all in the repo). `Task.dueDate` is stored and indexed (`@@index([dueDate])`) but nothing reads it to detect overdue tasks. MISSING.

---

## 8. Notification System

**PARTIALLY IMPLEMENTED** — in-app only.

- `src/lib/services/notifications.ts` — list (paginated), recent-for-widget, mark-one-read (ownership-checked via `userId` in the `where`), mark-all-read.
- Notifications are created inline, directly via `prisma.notification.create(...)`, scattered across `admin/tasks.ts`, `admin/leads.ts`, `client/messages.ts` — there is no central "notify" service/helper.
- **No delivery channel beyond the in-app bell.** `src/lib/email.ts` exists but is only called from the auth flow (password reset, email verification) — never from the notification system. No SMS, Slack, or push integration exists.
- This is exactly the kind of fan-out (email/Slack/SMS on top of the in-app row) that n8n is well suited to take over, once real events reach it — see §9 recommendations.

---

## 9. AI Integration

**IMPLEMENTED** for lead qualification only; **NOT implemented** for anything project-related.

- `src/lib/ai.ts` — `qualifyLeadAI()`. Direct `fetch` to OpenAI's Chat Completions endpoint, `response_format: json_object`, with a full deterministic fallback (keyword scoring) when `OPENAI_API_KEY` is absent — confirmed absent in the local `.env` today, so the app is currently running the fallback engine in production/dev alike.
- Called synchronously from `qualifyLead()` in `admin/leads.ts` — i.e., **the Next.js app calls OpenAI directly**; n8n is not in this loop at all right now.
- **No "AI Project Summary" feature exists in the codebase.** Grep across `src/` for `project summary`, `ai summary`, `projectSummary`, `generateSummary`, and for the literal tokens `{{project}}`, `{{tasks}}`, `{{updates}}` returned **zero matches**. See §6 (Step 6 investigation) below for what this means.

---

## 10. Existing API Endpoints

The **entire** set of HTTP route handlers in the repo (`src/app/api/**/route.ts`):

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | public | Login, sets JWT cookie |
| POST | `/api/auth/logout` | session | Clears cookie |
| POST | `/api/auth/forgot-password` | public | Sends reset email (or console-logs it) |
| POST | `/api/auth/reset-password` | public (token) | Consumes reset token |
| POST | `/api/auth/verify-email` | public (token) | Consumes verify token |
| POST | `/api/leads` | public, rate-limited, CSRF-checked | Public lead capture form target |

That's it — **six routes total**, none of them a JSON API for external consumption of Client/Project/Task/Notification data. Every other read/write in the app (all of admin, manager, client dashboards) goes through Next.js **Server Actions** in `src/lib/actions/*.ts`, which are React-only RPC endpoints — **not** callable by n8n or any external HTTP client.

**Consequence for n8n:** there is currently no way for an n8n workflow to (a) fetch a project's current tasks/updates, or (b) push a result (e.g., an AI summary, a qualification override) back into the app, because no such endpoints exist yet. This is the core gap. MISSING.

---

## 11. Existing Webhooks

**Outbound only** — `src/lib/n8n.ts`, `triggerN8nWebhook()`:

- POSTs to `env.N8N_WEBHOOK_URL` with header `X-Webhook-Secret: env.N8N_WEBHOOK_SECRET`, body `{ event, entityType, entityId, data }`.
- Every call — configured or not, success or failure — writes an `AutomationRun` row (idempotency key `${eventType}-${entityId}`), visible at `/admin/automations`. This audit trail is solid and reusable as-is.
- **Never throws** — a failed/unconfigured webhook never breaks the underlying database write. Good defensive design already in place.
- 5-second timeout via `AbortController`.

**Events actually wired up today (2 of them):**

| Event | Fired from | Entity |
|---|---|---|
| `LEAD_CREATED` | `src/lib/services/leads.ts` (public lead capture) | Lead |
| `PROJECT_CREATED` | `src/lib/services/admin/projects.ts` and `src/lib/services/admin/leads.ts` (lead→project conversion) | Project |

**Inbound webhooks: none exist.** No route under `src/app/api/` accepts a call *from* n8n. `N8N_WEBHOOK_SECRET` is defined and validated in `env.ts` but is only ever read in the outbound direction (`n8n.ts` line 72) — there is no matching inbound check anywhere in the repo.

---

## 12. Environment Variables

From `.env.example` (canonical list) cross-referenced with `env.ts` (Zod-validated) and the actual `.env` / `.env.production.local` (names only, values not reproduced here):

| Variable | Required | Purpose | Status |
|---|---|---|---|
| `DATABASE_URL` | Yes | Postgres (Neon) connection string | SET locally and in production |
| `JWT_SECRET` | Yes (≥32 chars) | Signs the session cookie | SET |
| `N8N_WEBHOOK_URL` | No | Outbound webhook target | SET locally (value not verified reachable) |
| `N8N_WEBHOOK_SECRET` | No | Shared secret sent to n8n | SET locally |
| `OPENAI_API_KEY` | No | Enables real AI qualification | **NOT set locally** — app runs on rules-engine fallback |
| `AI_MODEL` | No | OpenAI model name, default `gpt-4o-mini` | SET |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL (browser-visible) | SET |

Production (`.env.production.local`, pulled via Vercel CLI) additionally carries Neon-integration variables (`automation_*`, `clientautomation_*` — pooled/unpooled Postgres URLs, PG* discrete params) and standard `VERCEL_*` build metadata. No n8n-specific production variables beyond the two above were found — worth confirming in the Vercel dashboard whether `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` are actually set for the **production** environment, since a value only existing in local `.env` would mean production is silently running with `isN8NConfigured === false` (i.e., every automation attempt fails and logs to `AutomationRun`, but nothing ever reaches n8n).

---

## 13. Missing Components Required for n8n

| Component | Status | Why it's needed |
|---|---|---|
| Inbound webhook auth (shared-secret or signed-request check on a Next.js route) | MISSING | n8n needs to call back into the app (e.g. push an AI summary, update qualification, mark automation complete) and the app needs to verify the call really came from n8n. Nothing like this exists — only the outbound secret exists today. |
| A generic inbound webhook receiver route, e.g. `POST /api/webhooks/n8n` | MISSING | Single, secret-checked entry point for n8n → app callbacks, dispatched by `event` type. |
| Project/task/update data API for n8n to read | MISSING | No endpoint returns a project + its tasks + its recent updates as JSON. This is exactly what Step 6 needs — see below. |
| `TASK_CREATED` / `TASK_STATUS_CHANGED` webhook triggers | MISSING | `admin/tasks.ts` never calls `triggerN8nWebhook`. |
| `CLIENT_CREATED` (or "lead converted to client") trigger | MISSING | `convertLeadToClient()` never calls `triggerN8nWebhook`. |
| `PROJECT_STATUS_CHANGED` / `PROJECT_DEADLINE_APPROACHING` triggers | MISSING | No status-change or deadline-scan logic calls n8n. |
| Overdue-task detection (scheduled job) | MISSING | No cron/scheduled function exists in the repo (no `vercel.json`, no `/api/cron/*` route). Needed for both "task overdue" and "deadline approaching" events. |
| `ProjectMessage` (client feedback) → n8n trigger | MISSING | `createProjectMessage()` only creates an in-app notification. |
| A `ProjectUpdate`-shaped read model | MISSING (as a first-class concept) | Today "updates" = ad hoc `Task.updatedAt` sort + `ProjectMessage` + `Milestone`. Fine as a data source, but there's no single query/endpoint that assembles it — see §6/Step 6 below. |
| Centralized notification dispatch (so n8n can add email/Slack fan-out without touching every call site) | PARTIALLY MISSING | Notification creation is inlined in three separate service files; there's no single chokepoint an n8n-aware notifier could hook into cleanly. |
| Confirmation that `N8N_WEBHOOK_URL`/`SECRET` are set in **production** (Vercel), not just local `.env` | UNVERIFIED | See §12. |

---

## Step 6 — The `{{project}}` / `{{tasks}}` / `{{updates}}` Problem

**Finding: this feature does not exist in the application at all.** An exhaustive grep across `src/` for `{{project}}`, `{{tasks}}`, `{{updates}}`, and for any code path resembling "AI project summary" (`project summary`, `ai summary`, `projectSummary`, `generateSummary`) returned zero matches, in any file, in any casing.

This means the `{{project}}` / `{{tasks}}` / `{{updates}}` placeholders the user is seeing were written **inside an n8n workflow** (almost certainly an AI/LLM node's prompt template, built directly in the n8n editor), not inside this repository. n8n is evaluating those as its own expression placeholders, expecting them to be filled by whatever triggered that workflow — but nothing in this app currently sends a payload shaped that way, because:

1. No event in this app currently fires a webhook carrying project + tasks + updates data. The only two events sent to n8n today (`LEAD_CREATED`, `PROJECT_CREATED`) carry lead/project *metadata only* (id, title, status, etc. — see §11's payload fields), never the task list or update history.
2. There is no inbound API endpoint n8n could call to *fetch* `{project, tasks, updates}` on demand either (§10).

**Where the real data already lives, and how it should be assembled** (all of this already exists and works correctly — it just isn't exposed via any API today):

- `project` → `Project` model, fetched exactly as done in `src/lib/services/admin/projects.ts` (project detail query) or `src/app/client/projects/[id]/page.tsx`.
- `tasks` → `Task` rows where `projectId` matches, exactly as queried in `src/lib/services/client/projects.ts` (`getClientProjectExtras`) — title, status, priority, dueDate, updatedAt.
- `updates` → the same file's `recentUpdates` (tasks sorted by `updatedAt`, most recent first) **plus** `ProjectMessage` rows (client↔team messages) **plus** `Milestone` completions — this file already assembles the closest thing to a unified "updates" feed that exists in the system today.

**Correct fix (do not implement yet, per Step 5 — recorded here for the next phase):** build one authenticated API route, e.g. `GET /api/n8n/projects/:id/context` (protected by the same shared-secret pattern `N8N_WEBHOOK_SECRET` already establishes, just checked on the inbound side for once), that returns real `{ project, tasks, updates }` straight from Prisma using the queries above. The n8n workflow's AI node should then reference the *response fields of that HTTP call*, not hand-typed `{{project}}`/`{{tasks}}`/`{{updates}}` expressions with no data source. Under no circumstances should those placeholders be filled with fabricated/sample data — the fix is wiring the real endpoint, not faking the inputs.

---

## Step 4 — n8n Integration Points (event-by-event)

| # | Event | Trigger | Source (file) | API/webhook required | Payload (minimum) | Suggested n8n workflow |
|---|---|---|---|---|---|---|
| 1 | New lead | Public form submit | `src/lib/services/leads.ts` (already fires `LEAD_CREATED`) | Existing outbound webhook — **works today** | id, name, email, company, service, budgetRange, message, source | Lead notification (Slack/email to sales) + optional auto AI-qualify trigger |
| 2 | New client | Lead converted to client | `convertLeadToClient()` in `admin/leads.ts` — **does not fire today** | Add `triggerN8nWebhook({eventType: "CLIENT_CREATED", ...})` | clientId, companyName, convertedFromLeadId, userId (if portal created) | Client onboarding sequence (welcome email, CRM sync) |
| 3 | New project | Project created (direct or from lead) | `admin/projects.ts` / `admin/leads.ts` (already fires `PROJECT_CREATED`) | Existing outbound webhook — **works today** | projectId, title, clientId, managerId, status, originatingLeadId | Project kickoff checklist, notify assigned manager externally |
| 4 | New task | Task created | `createTask()` in `admin/tasks.ts` — **does not fire today** | Add `triggerN8nWebhook({eventType: "TASK_CREATED", ...})` | taskId, title, projectId, assigneeId, dueDate, priority | Assignee external notification (Slack/email) beyond the in-app row |
| 5 | Task status change | Task updated with new status | `updateTask()` in `admin/tasks.ts` — **does not fire today**, `oldStatus`/`newStatus` already computed locally | Add `triggerN8nWebhook({eventType: "TASK_STATUS_CHANGED", ...})` | taskId, projectId, oldStatus, newStatus, assigneeId | Progress rollups, client-facing status update, "task completed" ping |
| 6 | Task overdue | `dueDate < now` and status ≠ COMPLETED | **No scan job exists** — needs a new scheduled route, e.g. `GET /api/cron/overdue-tasks` on Vercel Cron | New scheduled endpoint that queries `Task` where `dueDate < now() AND status != COMPLETED`, then fires one event per overdue task (idempotency key already handles re-fires) | taskId, projectId, assigneeId, dueDate, daysOverdue | Escalation reminder to assignee + manager |
| 7 | Project update | Task status changes, milestone completed, or `ProjectMessage` posted | Composite of #5, milestone completion (no write path today — see §6), and `createProjectMessage()` | Add trigger(s) at each of those write points, or a single "project activity changed" event | projectId, updateType (task/message/milestone), summary | Client-facing digest, project-manager notification |
| 8 | Project deadline approaching | `Project.deadline` within N days | **No scan job exists** — same pattern as #6 | New scheduled endpoint, e.g. part of the same cron: `Project` where `deadline` within window and `status` not in (COMPLETED, CANCELLED) | projectId, title, deadline, daysRemaining, managerId | Manager reminder, client heads-up email |
| 9 | Client feedback | `ProjectMessage` created by a CLIENT-role author | `createProjectMessage()` in `client/messages.ts` — **does not fire today** | Add `triggerN8nWebhook({eventType: "CLIENT_FEEDBACK_RECEIVED", ...})`, gated on `author.role === "CLIENT"` | projectId, messageId, authorId, body excerpt | Route to manager's external channel, sentiment-flag urgent feedback |
| 10 | Support request | **No distinct "support request" entity exists** | N/A today — `ProjectMessage` is the only client→team channel, and it isn't typed as "support" vs. "general" | Either reuse #9 with a `category` field added to `ProjectMessage`, or introduce a new lightweight model | projectId/clientId, category, body | Ticket creation in an external help-desk tool |

---

## Final Output Summary

1. **Technology stack:** Next.js 14 (App Router) + TypeScript, Tailwind, PostgreSQL (Neon) via Prisma 5, custom JWT auth (`jose`/`bcryptjs`), Zod validation, deployed on Vercel. No existing n8n SDK/library — integration today is a hand-written `fetch` in `src/lib/n8n.ts`.
2. **Database:** Neon Postgres, Prisma-managed. Entities: `User`, `Client`, `Lead`, `LeadNote`, `Project`, `Milestone`, `ProjectMessage`, `Task`, `Notification`, `AutomationRun`, `AuditLog`, `VerificationToken`. No dedicated `ProjectUpdate` model — "updates" is a derived read today.
3. **Existing features:** lead capture + AI qualification (with rules-engine fallback) + admin management; client/project/task CRUD (task has no dedicated create form beyond admin); client portal with project detail, messaging, and notifications; audit logging; automation-run logging.
4. **Existing APIs:** 6 total route handlers, all auth-related plus one public lead-capture endpoint. Everything else is Server Actions, unreachable from n8n.
5. **Existing webhooks:** outbound-only, 2 events wired (`LEAD_CREATED`, `PROJECT_CREATED`), backed by a solid `AutomationRun` audit table and idempotency key. Zero inbound webhooks or inbound auth mechanism.
6. **Missing n8n integration points:** task events (create/status-change/overdue), client-creation event, project status/deadline events, client-feedback event, a scheduled/cron mechanism, an inbound authenticated webhook route, and a project-context read API (project+tasks+updates) for the AI summary use case.
7. **Recommended n8n workflows:** per §Step 4 table above — one workflow per event, using `AutomationRun`'s existing idempotency guarantee to stay safe under retries.
8. **Exact data flow (recommended, not yet built):**
   `App event → triggerN8nWebhook() → n8n workflow` for app-initiated events (leads, projects, tasks, feedback), **plus** `n8n → GET /api/n8n/projects/:id/context (new, secret-checked) → Prisma → real {project, tasks, updates} JSON → n8n's AI node` for the summary use case, **plus** a new Vercel Cron route for the two time-based events (overdue tasks, approaching deadlines) that nothing currently scans for.
9. **What should be implemented next** (in dependency order, not yet started — awaiting direction before building):
   1. Inbound webhook authentication helper (mirrors the outbound `N8N_WEBHOOK_SECRET` check, in reverse).
   2. `GET /api/n8n/projects/:id/context` — real project/tasks/updates data, fixing the Step 6 problem with real data, no fakes.
   3. Add the missing outbound triggers: `TASK_CREATED`, `TASK_STATUS_CHANGED`, `CLIENT_CREATED`, `CLIENT_FEEDBACK_RECEIVED`.
   4. A Vercel Cron route for overdue-task and deadline-approaching scans.
   5. Verify `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` are actually set in the Vercel **production** environment, not just local `.env`.
   6. Only after 1–5: build the actual n8n workflows against these real endpoints.

---

## Implementation Status

Built in Prompt 29, directly against the gaps identified above. Full detail
(architecture, payload shapes, n8n HTTP Request node configuration, error
handling, test mapping) is in
[`docs/n8n-integration.md`](./n8n-integration.md). This section is the
quick-reference checklist.

### Inbound authentication — IMPLEMENTED

`src/lib/n8n-auth.ts`. Separate from `src/lib/auth.ts` (human JWT sessions,
unmodified). Constant-time comparison (SHA-256 digest + `timingSafeEqual`)
against the existing `N8N_WEBHOOK_SECRET`, checked via header `X-N8N-Secret`.
Rejects missing/invalid/unconfigured with `401`/`401`/`503` respectively,
never echoes the secret. Covered by `src/lib/n8n-auth.test.ts` (10 tests).

### Project context endpoint — IMPLEMENTED

`GET /api/n8n/projects/:id/context` (`src/app/api/n8n/projects/[id]/context/route.ts`).
Real Prisma data only — no `ProjectUpdate` model was added (per this task's
explicit instruction); `updates` is assembled from `Task.updatedAt` +
`ProjectMessage` + `Milestone` by the pure, independently-tested function
`buildProjectUpdatesFeed()` in `src/lib/services/n8n/project-context.ts`.
Auth-checked, 400 on a malformed id, 404 on a well-formed-but-missing
project. This directly fixes the Step 6 finding above: the
`{{project}}`/`{{tasks}}`/`{{updates}}` placeholders now have a real HTTP
endpoint to resolve against. Covered by `route.test.ts` (6 tests) and
`project-context.test.ts` (7 tests).

### Outbound events — IMPLEMENTED (8 of 10; 1 correctly skipped)

`LEAD_CREATED` and `PROJECT_CREATED` were already wired. Added:
`CLIENT_CREATED`, `TASK_CREATED`, `TASK_UPDATED`, `PROJECT_UPDATED`,
`CLIENT_FEEDBACK`, `TASK_OVERDUE`, `PROJECT_DEADLINE_APPROACHING` — all
through the existing, unmodified `triggerN8nWebhook()` /
`AutomationRun` pipeline; no second logging system was introduced.
`SUPPORT_REQUEST` was deliberately **not** implemented — no corresponding
concept exists in the schema (see `docs/n8n-integration.md` §4 for the
reasoning). Covered indirectly via `src/lib/n8n.test.ts`, which tests the
shared function every one of these call sites uses.

### Cron / scheduled automation — IMPLEMENTED

`GET /api/cron/automation-scan`, scheduled daily via `vercel.json`
(`0 8 * * *`, Hobby-plan-compatible). Detects overdue tasks and
approaching-deadline projects and fires the two events above through the
same `triggerN8nWebhook()` path. Protected by a new `CRON_SECRET`
(Vercel's own convention — see §Environment Variables below). Does **not**
send reminders or generate reports itself — that stays WF-004/WF-005's job,
avoiding duplicate automation logic.

### Environment variables — IMPLEMENTED

One new variable: `CRON_SECRET`. `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` are
reused as-is (the secret now also guards the inbound direction). All three
documented in `.env.example` with inline comments on which route/direction
each guards. **Still unverified:** whether these are actually set in the
Vercel **Production** environment (local `.env` only proves the code path
works; see §12 above).

### Testing — IMPLEMENTED (new test framework added)

No test framework existed in this repository before this task. **Vitest**
was added (one dev dependency, one config file, one `npm test` script) as
the minimum footprint to cover the 13 required scenarios. 28 tests across 4
files, all passing — full mapping from each required scenario to its test
in `docs/n8n-integration.md` §8.

### Verification performed

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Clean, no errors |
| `npx next lint` | Clean, no warnings or errors |
| `npx prisma validate` | Schema valid — **unchanged**, no migration needed |
| `npm test` (Vitest) | 28/28 passing |
| `npm run build` | Succeeds; both new routes (`/api/cron/automation-scan`, `/api/n8n/projects/[id]/context`) compiled as dynamic functions alongside all 42 pre-existing routes/pages |

### Remaining work (not done in this task, by design)

- Confirm `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, `CRON_SECRET` are set in
  Vercel's Production environment (not just local `.env`).
- End-to-end manual verification of the cron route against a real database
  row (an actual overdue task / near-term deadline) — the route's own
  Prisma queries are not unit-tested in isolation, only the delivery
  function they call (see `docs/n8n-integration.md` §8, "Not covered").
- Building WF-006 onward, and any n8n-side workflow changes to WF-001–005
  to make use of the new events/endpoint — explicitly out of scope for this
  task.
- If a real "support request" concept is ever added to the schema, wiring
  its `SUPPORT_REQUEST` event (see `docs/n8n-integration.md` §4).
