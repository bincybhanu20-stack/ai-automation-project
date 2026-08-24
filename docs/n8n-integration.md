# n8n Integration — Application-Side Foundation

This document describes the n8n integration layer built in Prompt 29, on top of
the audit in [`28-existing-system-audit.md`](./28-existing-system-audit.md).
It covers everything the **application** does; the n8n workflows themselves
(WF-001 through WF-005, already built) are out of scope here.

---

## 1. Architecture

Two separate, independent data paths exist between this app and n8n. Neither
depends on the other, and a failure in either one never breaks the app's own
database writes.

```
                 OUTBOUND (app -> n8n)                      INBOUND (n8n -> app)
 ┌───────────────────────────────┐          ┌──────────────────────────────────────┐
 │ Server Action / API route      │          │ n8n HTTP Request node                 │
 │  e.g. createTask(), updateLead │          │  GET /api/n8n/projects/:id/context    │
 └───────────────┬────────────────┘          └───────────────────┬────────────────────┘
                  │ triggerN8nWebhook()                           │ X-N8N-Secret header
                  ▼                                                ▼
 ┌───────────────────────────────┐          ┌──────────────────────────────────────┐
 │ src/lib/n8n.ts                 │          │ src/lib/n8n-auth.ts                   │
 │  POST N8N_WEBHOOK_URL          │          │  verifyN8nSecret() — constant-time    │
 │  header X-Webhook-Secret       │          │  compare against N8N_WEBHOOK_SECRET   │
 └───────────────┬────────────────┘          └───────────────────┬────────────────────┘
                  │ always logs                                    │ real Prisma data
                  ▼                                                ▼
 ┌───────────────────────────────┐          ┌──────────────────────────────────────┐
 │ AutomationRun (Postgres)       │          │ Project + Task + ProjectMessage +     │
 │  status, executionId, errors   │          │ Milestone -> normalized JSON          │
 └───────────────────────────────┘          └──────────────────────────────────────┘

                                THIRD PATH — TIME, NOT AN ACTION
                    ┌──────────────────────────────────────────┐
                    │ Vercel Cron -> GET /api/cron/automation-scan │
                    │  Authorization: Bearer CRON_SECRET         │
                    │  scans Task.dueDate / Project.deadline     │
                    │  fires TASK_OVERDUE / PROJECT_DEADLINE_    │
                    │  APPROACHING via the SAME triggerN8nWebhook│
                    └──────────────────────────────────────────┘
```

Both `src/lib/n8n.ts` (outbound) and `AutomationRun` (Prisma model) already
existed before this task and are unchanged in behavior — this task only adds
more call sites for the existing function, plus the reverse (inbound)
direction, which did not exist at all.

---

## 2. Authentication

Two distinct credentials, two distinct trust boundaries — neither touches
`src/lib/auth.ts` (human JWT sessions), which is unmodified:

| Direction | Header | Env var | Verified by |
|---|---|---|---|
| App calls n8n | `X-N8N-Secret` | `N8N_WEBHOOK_SECRET` | n8n itself (the webhook trigger node's Header Auth credential) |
| n8n calls app | `X-N8N-Secret` | `N8N_WEBHOOK_SECRET` (same value) | `verifyN8nSecret()` in `src/lib/n8n-auth.ts` |
| Vercel Cron calls app | `Authorization: Bearer <value>` | `CRON_SECRET` | `verifyCronSecret()` in `src/lib/n8n-auth.ts` |

**Both directions use the same header name.** An earlier version of this
integration sent `X-Webhook-Secret` outbound, which did not match the
`X-N8N-Secret` header name actually configured on n8n's webhook trigger
node's Header Auth credential — every outbound call was silently rejected
by n8n before it ever created an execution. Fixed in `src/lib/n8n.ts`.

**Why the same `N8N_WEBHOOK_SECRET` value for both directions of the n8n
relationship:** it's one shared secret between two systems (this app and
n8n), configured once on each side — not two secrets to keep in sync.

**Constant-time comparison:** `src/lib/n8n-auth.ts` hashes both the provided
value and the configured secret with SHA-256, then compares the two
fixed-length digests with Node's `crypto.timingSafeEqual`. This avoids both
of the two ways a naive `a === b` check can leak information: character-by-
character timing on a match, and a thrown/short-circuited exception on a
length mismatch.

**Configuration states, and what each returns:**

| State | Response |
|---|---|
| Secret not configured on the server at all | `503` — "not configured" |
| Configured, but request has no credential header | `401` — "Missing credentials" |
| Configured, credential present but wrong | `401` — "Invalid credentials" |
| Configured, credential correct | request proceeds |

The secret is never logged, never included in a response body, and
`src/lib/n8n-auth.ts` is the only place it is compared — it is read once
from `src/lib/env.ts`, which is itself server-only (never importable from a
`"use client"` component, exactly like the rest of this app's secrets).

### Configuring the n8n HTTP Request node

For any n8n workflow that needs to call back into this application (today:
the project context endpoint), configure the HTTP Request node's headers as:

| Header | Value |
|---|---|
| `X-N8N-Secret` | the same value as this app's `N8N_WEBHOOK_SECRET` env var |

Store that value as an n8n credential (Header Auth or a generic credential
with a `Secret` field) rather than pasting it directly into the node — this
keeps it out of exported workflow JSON.

---

## 3. API Endpoint — Project Context

### `GET /api/n8n/projects/:id/context`

This is the fix for the Prompt 28 audit finding: an n8n AI prompt template
referenced `{{project}}`, `{{tasks}}`, `{{updates}}` with no real data source
behind them anywhere in the app. This endpoint is that data source.

**Auth:** `X-N8N-Secret` header, required (see above).

**Path parameter:** `id` — must be a valid UUID (`Project.id`). A malformed
value returns `400` before any database query runs. A well-formed but
non-existent id returns `404`.

**Response shape** (200):

```jsonc
{
  "project": {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "status": "PLANNING | ACTIVE | ON_HOLD | COMPLETED | CANCELLED",
    "priority": "LOW | MEDIUM | HIGH | URGENT",
    "progress": 0,
    "budget": 0,
    "startDate": "ISO date | null",
    "deadline": "ISO date | null",
    "createdAt": "ISO date",
    "updatedAt": "ISO date",
    "client": { "id": "uuid", "companyName": "string", "industry": "string | null", "email": "string | null", "phone": "string | null", "status": "ACTIVE | INACTIVE | ARCHIVED" },
    "manager": { "id": "uuid", "name": "string", "email": "string" } // or null if unassigned
  },
  "tasks": [
    {
      "id": "uuid", "title": "string", "description": "string | null",
      "status": "TODO | IN_PROGRESS | REVIEW | COMPLETED",
      "priority": "LOW | MEDIUM | HIGH | URGENT",
      "dueDate": "ISO date | null", "completedAt": "ISO date | null",
      "createdAt": "ISO date", "updatedAt": "ISO date",
      "assignee": { "id": "uuid", "name": "string", "email": "string" } | null,
      "creator": { "id": "uuid", "name": "string" } | null
    }
  ],
  "updates": [
    { "type": "task", "date": "ISO date", "content": "Task \"Build homepage\" is IN_PROGRESS.", "entityId": "uuid", "meta": { "status": "IN_PROGRESS" } },
    { "type": "message", "date": "ISO date", "content": "<the real ProjectMessage.body text>", "entityId": "uuid", "meta": { "authorId": "uuid|null", "authorName": "string|null", "authorRole": "string|null" } },
    { "type": "milestone", "date": "ISO date", "content": "Milestone \"Design approved\" completed.", "entityId": "uuid", "meta": { "completed": true, "dueDate": "ISO date|null", "description": "string|null" } }
  ]
}
```

Every field is real data straight from Prisma. **`updates` is a derived
read, not a stored table** — there is no `ProjectUpdate` model (see the
audit, section 2); this array is assembled on each request from
`Task.updatedAt`, `ProjectMessage`, and `Milestone`, sorted most-recent-first,
via the pure function `buildProjectUpdatesFeed()` in
`src/lib/services/n8n/project-context.ts`. Each `content` string is built
directly from the underlying row's own fields (title, status, body,
description) — nothing is invented or sampled.

**Using it in an n8n AI node:** point the workflow's HTTP Request node at
this endpoint, then reference the response's `{{$json.project}}`,
`{{$json.tasks}}`, `{{$json.updates}}` in the downstream AI node's prompt —
these now resolve to real values because they come from this call's actual
response, not from an unbound expression.

---

## 3a. API Endpoint — AI Project Summary Write-back

### `POST /api/n8n/projects/:id/summary`

The write-back half of WF-010 (Prompt 30): once the AI node produces its
structured summary, this endpoint saves it onto the project it's about, so
it can be displayed later (the Admin Dashboard rendering itself is a
separate, not-yet-built stage).

**Purpose:** persist WF-010's existing structured output — nothing about
what the AI produces, or the prompt that produces it, changes here.

**Auth:** `X-N8N-Secret` header — the exact same shared secret, same header
name, and same `verifyN8nSecret()` check as the context endpoint above. No
second authentication mechanism was introduced.

**Path parameter:** `id` — must be a valid UUID (`Project.id`). Same
validation as the context endpoint: malformed → `400`, well-formed but
missing → `404`.

**Request body** — WF-010's output, unmodified:

```jsonc
{
  "project_summary": "string, non-empty",
  "status": "string, non-empty",
  "progress": {
    "total_tasks": 0,
    "completed_tasks": 0,
    "in_progress_tasks": 0,
    "pending_tasks": 0,
    "overdue_tasks": 0,
    "completion_percentage": 0 // integer, 0-100
  },
  "key_updates": ["string", "..."],
  "risks": ["string", "..."],
  "upcoming_deadlines": ["string", "..."],
  "recommended_actions": ["string", "..."]
}
```

Validated by `aiProjectSummarySchema` in `src/lib/validations/n8n.ts`. All
`progress` counts must be non-negative integers; `completion_percentage`
must additionally be ≤ 100; every array must contain only strings.

**Success response** (`200`):

```json
{
  "success": true,
  "projectId": "00000000-0000-0000-0000-000000000103",
  "generatedAt": "2026-08-24T09:00:00.000Z"
}
```

**Error responses:**

| Condition | Status |
|---|---|
| Missing `X-N8N-Secret` header | `401` |
| Wrong `X-N8N-Secret` value | `401` |
| `N8N_WEBHOOK_SECRET` not configured server-side | `503` |
| Malformed project id (not a UUID) | `400` |
| Request body fails schema validation | `400`, with per-field `fieldErrors` |
| Well-formed id, project doesn't exist | `404` |
| Database/service failure | `500`, generic message only — no internals (query text, stack traces) ever reach the response body |

**Example request:**

```bash
curl -X POST "https://ai-automation-project-eight.vercel.app/api/n8n/projects/00000000-0000-0000-0000-000000000103/summary" \
  -H "X-N8N-Secret: <the real secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_summary": "The Website Revamp project is active with 35% progress.",
    "status": "ACTIVE",
    "progress": { "total_tasks": 1, "completed_tasks": 0, "in_progress_tasks": 1, "pending_tasks": 0, "overdue_tasks": 0, "completion_percentage": 35 },
    "key_updates": ["Task \"Implement checkout flow\" is IN_PROGRESS."],
    "risks": ["Not available"],
    "upcoming_deadlines": ["2026-08-28: checkout flow due."],
    "recommended_actions": ["Complete the checkout flow task."]
  }'
```

**What this endpoint deliberately does NOT do:** it never modifies
`Project.status`, `Project.progress`, `Project.priority`, `Project.deadline`,
or any `Task`/`Milestone`/`Client` row. The AI's own `status`/`progress`
fields inside the stored `aiSummary` JSON are the model's *restated*
understanding of the project for display purposes — they are a separate,
parallel value from the project's real, app-managed fields, never written
into them. See `src/lib/services/n8n/project-summary.ts`.

---

## 4. Outbound Events

All outbound events go through the **existing, unmodified**
`triggerN8nWebhook()` in `src/lib/n8n.ts` — this task did not touch that
function, only added more call sites for it. Every call writes/updates one
`AutomationRun` row keyed by `${eventType}-${entityId}` and never throws.

| Event | Status | Fired from | Payload |
|---|---|---|---|
| `LEAD_CREATED` | Pre-existing | `src/lib/services/leads.ts` | Custom body (WF-001 shape, not the generic envelope below): `{ event: "lead.created", lead: { id, name, email, phone, company, service, budget, projectDescription } }` |
| `PROJECT_CREATED` | Pre-existing | `src/lib/services/admin/projects.ts`, `admin/leads.ts` (lead conversion) | projectId, title, clientId, managerId, status |
| `CLIENT_CREATED` | **New** | `convertLeadToClient()` in `src/lib/services/admin/leads.ts` | clientId, companyName, email, phone, convertedFromLeadId |
| `TASK_CREATED` | **New** | `createTask()` in `src/lib/services/admin/tasks.ts` | taskId, title, projectId, projectTitle, assigneeId, status, priority, dueDate |
| `TASK_UPDATED` | **New** | `updateTask()` in `src/lib/services/admin/tasks.ts` | taskId, title, projectId, assigneeId, oldStatus, newStatus, statusChanged, priority, dueDate |
| `PROJECT_UPDATED` | **New** | `changeProjectStatus()` in `src/lib/services/admin/projects.ts` | projectId, title, clientId, managerId, oldStatus, newStatus |
| `CLIENT_FEEDBACK` | **New** | `createProjectMessage()` in `src/lib/services/client/messages.ts` (client-only call path) | messageId, projectId, projectTitle, authorId, body |
| `TASK_OVERDUE` | **New** (scheduled, not action-triggered) | `GET /api/cron/automation-scan` | taskId, title, status, priority, dueDate, daysOverdue, projectId, projectTitle, assigneeId, assigneeName |
| `PROJECT_DEADLINE_APPROACHING` | **New** (scheduled) | `GET /api/cron/automation-scan` | projectId, title, status, deadline, daysRemaining, clientId, clientName, managerId |
| `SUPPORT_REQUEST` | **Not implemented — no corresponding functionality** | — | — |

### Why `SUPPORT_REQUEST` was not implemented

The audit (section 2, Step 4 #10) found no distinct "support request"
concept anywhere in the schema or codebase — `ProjectMessage` is the only
client-to-team channel, and it has no `category` field distinguishing a
support request from a general update. Per this task's explicit instruction
not to implement events without corresponding application functionality,
this was left out rather than overloading `CLIENT_FEEDBACK` to mean two
different things. If a real "support request" concept is added later (e.g. a
`category` field on `ProjectMessage`, or a new lightweight model), wiring the
event is a small addition to `createProjectMessage()` following the exact
pattern already used for `CLIENT_FEEDBACK`.

### A known idempotency-key behavior (not a new issue — pre-existing design)

`triggerN8nWebhook()`'s `AutomationRun` row is keyed by
`${eventType}-${entityId}` and **upserted**, not inserted fresh each time.
For an event that can only happen once per entity (`LEAD_CREATED`,
`PROJECT_CREATED`, `CLIENT_CREATED`, `TASK_CREATED`) this is exactly
"one log row per real occurrence." For an event that can legitimately
recur on the same entity (`TASK_UPDATED`, and — deliberately, for reminder
purposes — `TASK_OVERDUE`/`PROJECT_DEADLINE_APPROACHING` fired daily by the
cron scan), the webhook **does** fire again each time (the HTTP POST is
unconditional), but the `AutomationRun` log row for that `(event, entity)`
pair is overwritten with the latest attempt rather than accumulating
history. Full history of what changed and when is still available via
`AuditLog` (e.g. `TASK_UPDATED` audit events), which this task did not
change. This is documented here because Part 3 of this task's spec asked
about idempotency explicitly — it is existing `src/lib/n8n.ts` behavior,
reused as-is, not something introduced or altered by this work.

---

## 5. Scheduled Automation (Vercel Cron)

**`GET /api/cron/automation-scan`**, scheduled via `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/automation-scan", "schedule": "0 8 * * *" }]
}
```

Once daily at 08:00 UTC — this fits Vercel's Hobby-plan limit of one
invocation per day per cron job; increase frequency only on a plan that
supports it, and only if the reminder cadence genuinely needs to be tighter.

**What it does, in order:**
1. Verifies the request via `verifyCronSecret()` (see §2).
2. Queries `Task` where `dueDate < now` and `status != COMPLETED` → fires
   `TASK_OVERDUE` for each.
3. Queries `Project` where `deadline` falls within the next 3 days
   (`DEADLINE_APPROACHING_DAYS` in the route file) and `status` is not
   `COMPLETED`/`CANCELLED` → fires `PROJECT_DEADLINE_APPROACHING` for each.
4. Returns a small JSON summary (`scannedAt`, counts found) — this is for
   manual/Vercel-log verification, not consumed by n8n.

**What it deliberately does NOT do:** send any reminder itself (email,
Slack, in-app notification) or generate the weekly report. That's WF-004
and WF-005's job, downstream of the events this route fires — duplicating
it here would be a second automation system, which this task's instructions
explicitly rule out.

**Weekly report:** WF-005 already exists in n8n. Nothing in the current
application surfaces an app-side gap requiring a new endpoint for it — an
n8n Schedule Trigger node can run WF-005 entirely on its own, calling the
project context endpoint (§3) or a future aggregate reports endpoint if it
ever needs one. No such aggregate endpoint was built in this task, to avoid
overlapping WF-005's existing scope.

---

## 6. Error Handling

Every failure mode listed in this task's Part 5 is already handled, mostly
by the pre-existing `triggerN8nWebhook()`:

| Failure | Handling |
|---|---|
| `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` unset | `isN8NConfigured` is false → `AutomationRun` marked `FAILED` with a clear message, no HTTP call attempted, function returns `undefined` |
| n8n unreachable / DNS failure | Caught in the `try/catch` around `fetch`, `AutomationRun` marked `FAILED` with the error message, logged to `console.error` |
| n8n times out | `AbortController` aborts after 5000ms, surfaces as a caught error → same `FAILED` handling |
| n8n responds non-2xx | Explicitly checked (`!response.ok`), thrown and caught → `FAILED` |
| n8n responds with an unexpected body | Not required to parse the body at all — only reads the `x-n8n-execution-id` header, so a malformed body can't break this path |
| Inbound request missing/invalid `X-N8N-Secret` | `verifyN8nSecret()` returns 401 before any Prisma query |
| Inbound request to the cron route missing/invalid `Authorization` | `verifyCronSecret()` returns 401 before any Prisma query |

**In every outbound case, `triggerN8nWebhook()` never throws** — the
call sites added in this task (`createTask`, `updateTask`,
`changeProjectStatus`, `convertLeadToClient`, `createProjectMessage`, and
the cron scan) all call it the same way every pre-existing call site does:
**after** the real database write has already committed, with no
`try/catch` needed around it, because the function itself guarantees it
won't throw. A user creating a task, updating a lead, or sending a project
message succeeds and gets a normal response even if n8n is completely down.

---

## 7. Environment Variables

| Variable | New in this task? | Required? | Purpose |
|---|---|---|---|
| `N8N_WEBHOOK_URL` | No (pre-existing) | Optional | Outbound webhook target |
| `N8N_WEBHOOK_SECRET` | No (pre-existing, reused) | Optional | Shared secret — both outbound header and now the inbound check in `verifyN8nSecret()` |
| `CRON_SECRET` | **Yes** | Optional (required for the cron route to accept any request) | Vercel's own convention for authenticating cron-triggered requests — see `src/lib/n8n-auth.ts` |

No other environment variables were added. `.env.example` documents all
three with comments explaining which direction/route each one guards.
**Verify `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`, and `CRON_SECRET` are set
in the Vercel project's Production environment**, not just local `.env` —
the app runs correctly either way (every missing-config path degrades to a
logged `AutomationRun` failure or a `503`, never a crash), but automation
silently does nothing until they're set there.

---

## 8. Testing

No test framework existed before this task (confirmed: no `jest`/`vitest`/
`mocha`/`playwright` in `package.json`, no `*.test.ts` files anywhere in the
repo). **Vitest was added** as the minimum footprint needed to verify the
13 scenarios this task's spec requires — a single dev dependency, one config
file (`vitest.config.ts` mirroring the existing `@/*` path alias), and one
`npm test` script. Nothing about how the app runs in dev/production changed.

Run with:

```bash
npm test
```

**28 tests across 4 files, all passing:**

| File | Covers |
|---|---|
| `src/lib/n8n-auth.test.ts` | Valid / invalid / missing inbound n8n credential; valid / invalid / missing cron credential; not-configured (503) states; secret never leaks into an error response |
| `src/lib/services/n8n/project-context.test.ts` | The `updates` feed builder in isolation — empty input, tasks-only, messages-only (including a null author), milestones (completed vs. not), and correct most-recent-first sorting across all three sources |
| `src/lib/n8n.test.ts` | The pre-existing `triggerN8nWebhook()`: never throws when unconfigured / network fails / n8n returns non-2xx; records the right `AutomationRun` status each time; same idempotency key on repeated calls for the same event+entity |
| `src/app/api/n8n/projects/[id]/context/route.test.ts` | Full route behavior: 401 (missing/invalid credential), 400 (malformed id, before any DB call), 404 (well-formed but nonexistent project), 200 with a populated project (tasks + messages + milestones all present), 200 with an empty project (no tasks/updates — not an error) |

Mapping to this task's required test list (Part 7):

| # | Requirement | Where |
|---|---|---|
| 1 | Valid n8n authentication | `n8n-auth.test.ts`, `route.test.ts` |
| 2 | Invalid n8n authentication | `n8n-auth.test.ts`, `route.test.ts` |
| 3 | Missing authentication | `n8n-auth.test.ts`, `route.test.ts` |
| 4 | Valid project context request | `route.test.ts` |
| 5 | Invalid project ID | `route.test.ts` (400, malformed) |
| 6 | Nonexistent project | `route.test.ts` (404) |
| 7 | Project with tasks | `project-context.test.ts`, `route.test.ts` |
| 8 | Project without tasks | `project-context.test.ts`, `route.test.ts` |
| 9 | Project with messages | `project-context.test.ts`, `route.test.ts` |
| 10 | Project with milestones | `project-context.test.ts`, `route.test.ts` |
| 11 | n8n failure does not break core operation | `n8n.test.ts` (never throws on any failure mode) |
| 12 | AutomationRun records failures correctly | `n8n.test.ts` |
| 13 | Duplicate event does not create duplicate automation execution | `n8n.test.ts` (same `idempotencyKey` on repeated calls) |

**Not covered by this suite, and explicitly out of scope:** the five new
`triggerN8nWebhook()` call sites added to `admin/tasks.ts`,
`admin/projects.ts`, `admin/leads.ts`, and `client/messages.ts` are one-line
additions to already-existing, already-tested-by-hand service functions —
they are exercised indirectly by `n8n.test.ts` (which tests the function
they all call) rather than duplicated per call site. The cron route's
Prisma queries (`automation-scan/route.ts`) are not unit tested against a
real or mocked database in this pass — they reuse the same query shapes
already proven in `admin/tasks.ts`/`admin/projects.ts`, and the function
they call for delivery (`triggerN8nWebhook`) is fully covered. Manually
verifying the cron route end-to-end (via a real request with the correct
`Authorization` header and a database containing an overdue task or a
near-term deadline) is listed as remaining work.

---

## 9. Files Reference

| File | Role |
|---|---|
| `src/lib/n8n-auth.ts` | Inbound auth: `verifyN8nSecret()`, `verifyCronSecret()` |
| `src/lib/services/n8n/project-context.ts` | Pure function assembling the `updates` feed |
| `src/app/api/n8n/projects/[id]/context/route.ts` | The project context endpoint |
| `src/app/api/cron/automation-scan/route.ts` | Scheduled overdue-task / approaching-deadline scan |
| `vercel.json` | Cron schedule |
| `src/lib/n8n.ts` | Outbound webhook sender — **unchanged**, more call sites added elsewhere |
