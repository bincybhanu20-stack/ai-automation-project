# 30 — WF-010: AI Project Summary (n8n Workflow Specification)

This document is a build spec for a workflow to be **created manually in the
n8n editor**. Nothing in this document was created by, or claims to have
been created by, an automated tool — no workflow exists in n8n yet. This is
the blueprint a developer follows to build it by hand.

No application code was changed to produce this document (see
[Prerequisite](#prerequisite--read-this-before-building-anything) below for
the one thing that *does* need to happen in the app repo — a deploy, not a
code change).

---

## Prerequisite — read this before building anything

**The endpoint this workflow depends on is not live yet.** Prompt 29 built
`GET /api/n8n/projects/:id/context` and verified it with `npm run build` and
`npm test` locally, but that work was **never committed or pushed** — `git
log` shows the last commit is still the pre-Prompt-29 rebrand, and `git
status` shows the endpoint's files as uncommitted/untracked.

I confirmed this against the live deployment (read-only `curl`, no data
changed):

```
GET /api/n8n/projects/<any-id>/context  -> HTTP 404 (Next.js's own 404 page,
                                             Content-Disposition: inline; filename="404")
GET /api/leads (a route that DOES exist) -> HTTP 405 (proves the deployment
                                             itself is reachable and routes
                                             that exist do respond)
```

That 404 is Next.js serving its built-in not-found page for an unmatched
route — not deployment protection, not the endpoint's own 404 JSON response
(which would be `Content-Type: application/json`, not `text/html`). The
route simply isn't part of the deployed build.

**This means every test in this document will fail until Prompt 29's
changes are committed and pushed to the branch Vercel deploys from.** I have
not done that myself — pushing to the deployed branch is a step I'm
flagging for you to confirm, not something to do silently. Once it's
pushed and Vercel finishes redeploying, `GET /api/leads` returning `405`
above confirms the deployment pipeline itself works fine — the new route
will appear as soon as its commit lands.

Everything below (URLs, node config, expressions) is written against the
**real, already-verified contract** of the endpoint — none of it changes
once the deploy happens. You can build the workflow now; just don't expect
Test 1 to pass until the deploy is done.

---

## Architecture

```
[1] WF-010 Manual Test  ──▶  [2] Project ID Input  ──▶  [3] Get Project Context
 (Manual Trigger)              (Edit Fields / Set)         (HTTP Request, GET)
                                                                    │
                                                     success ──┐    │ non-2xx (401/404/503)
                                                                │    ▼
                                                                │  workflow stops here —
                                                                │  n8n's own error view,
                                                                │  AI never runs
                                                                ▼
                                              [4] Verify API Response (Code)
                                              throws + stops workflow if
                                              project/tasks/updates are malformed
                                                                │ valid shape
                                                                ▼
                              [5a] OpenAI Chat Model  ──▶  [5b] WF-010 AI Project Summary
                                  (sub-node, model)            (Basic LLM Chain)
                                                                    │ raw JSON text
                                                                    ▼
                                              [6] WF-010 Structured Output (Code)
                                              JSON.parse + field validation
                                                                    │
                                                                    ▼
                                              [7] WF-010 Final Result (Edit Fields / Set)
                                              clean, human-readable summary
```

Two deliberate error-handling decisions, both because the objective says
"the AI must not run on bad data":

- **Node 3 (HTTP Request) is left at its default error behavior** (does
  *not* set `neverError`). A 401/404/503 response makes the node itself
  throw, which halts the whole workflow immediately, before node 4 or the
  AI node ever execute. This is the simplest way to guarantee "stop the
  workflow, AI never runs" for an API-level failure (Tests 5 and 6) — no
  extra branching required.
- **Node 4 is a second, independent check** on the *shape* of a
  successful (200) response, because "the call succeeded" and "the body is
  actually usable" are different failure modes — a 200 with an unexpected
  body shape should be caught before it reaches the AI too.

---

## Node 1 — Manual Trigger

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.manualTrigger` |
| Version | 1 |
| Name | `WF-010 Manual Test` |
| Parameters | none |

Drag it in first — every n8n workflow needs a trigger, and Manual Trigger
is the only node that adds a "Test workflow" button, which is exactly what
you want while you're still verifying this end to end. Swap it out later
(see [Future: switching the trigger](#future-switching-the-trigger)).

---

## Node 2 — Project ID Input

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.set` (displayed as **"Edit Fields (Set)"**) |
| Version | 3.5 |
| Name | `Project ID Input` |
| Mode | `Manual Mapping` (`mode: "manual"`) |

**Fields to Set → Add Field:**

| Name | Type | Value |
|---|---|---|
| `projectId` | String | *(paste a real UUID here — see below)* |

**Getting a real project ID — do not invent one.** Pick any of these:

1. **Prisma Studio** (fastest, if you have local DB access): `npm run
   db:studio`, open the `Project` table, copy any row's `id` column.
2. **The admin dashboard** on the deployed app: log in, go to
   `/admin/projects`, open any project, copy the UUID from the URL
   (`/admin/projects/<this-part>`).
3. **A direct query**, if you have `DATABASE_URL` / psql access:
   `SELECT id, title FROM "Project" LIMIT 5;`

Paste that UUID as this field's value. Leaving it as placeholder text will
make Node 3's URL resolve to a nonsense path and correctly produce a `400
Invalid project id` — that's expected and is actually **Test 5** below, not
a mistake.

---

## Node 3 — HTTP Request (Get Project Context)

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.httpRequest` |
| Version | 4.5 |
| Name | `Get Project Context` |

**Request:**

| Field | Value |
|---|---|
| Method | `GET` |
| URL | `={{ "https://ai-automation-project-eight.vercel.app/api/n8n/projects/" + $json.projectId + "/context" }}` |

This is the app's real, confirmed-live deployed URL (the same one given at
the start of this project and re-verified by the `curl` check above) — not
invented. `$json.projectId` reads directly from Node 2, since Node 3 is
wired straight after it.

### Authentication header — do NOT hardcode the secret in the node

Per the endpoint's contract (`src/lib/n8n-auth.ts`), the app expects header
`X-N8N-Secret` to equal the app's `N8N_WEBHOOK_SECRET` value. The HTTP
Request node's own guidance for a custom auth header (not a query param, not
a body field) is: use a **generic credential of type "Header Auth"**, not a
literal value typed into the node.

| Field | Value |
|---|---|
| Authentication | `Generic Credential Type` (`authentication: "genericCredentialType"`) |
| Generic Auth Type | `Header Auth` (`genericAuthType: "httpHeaderAuth"`) |
| Credential | *(create new)* → **Name**: `X-N8N-Secret`, **Value**: the app's real `N8N_WEBHOOK_SECRET` value |

Save that credential once (n8n names call it something like **"Header Auth
account"** — rename it to `n8n webhook shared secret` or similar so it's
identifiable), then select it here. This keeps the secret:
- out of the workflow's JSON export (credentials are stored separately from
  workflow definitions in n8n),
- out of execution logs (n8n masks credential values in the UI and in
  "Copy to clipboard" exports),
- out of this document — nowhere above is the actual secret value written
  down, only where to put it.

**Do not** use the node's plain "Headers" section (`sendHeaders: true` +
typing `X-N8N-Secret` / the real value directly into Header Parameters) —
that stores the secret in cleartext inside the workflow JSON itself, which
gets exported, version-controlled, or duplicated far more easily than a
credential does.

### Everything else on this node: leave at defaults

- `sendQuery`: off (no query string needed — the id is in the path)
- `sendBody`: off (this is a `GET`)
- Response format: leave as `autodetect` (the endpoint returns
  `Content-Type: application/json`, so n8n parses it automatically into
  `$json`)
- **Do not enable `neverError`** — see [Architecture](#architecture) above.
  A non-2xx response should throw and stop the workflow here.

---

## Node 4 — Verify API Response

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.code` |
| Version | 2 |
| Name | `Verify API Response` |
| Mode | `Run Once for All Items` (`mode: "runOnceForAllItems"`) |
| Language | JavaScript |

By the time this node runs, Node 3 has already succeeded with a 2xx status
— this node checks the **body shape**, not the HTTP status.

**JavaScript code** (paste into the "JavaScript" field):

```javascript
const body = $input.first().json;

if (!body || typeof body !== "object") {
  throw new Error("WF-010: HTTP Request returned no JSON body.");
}

if (!body.project || typeof body.project !== "object" || !body.project.id) {
  throw new Error(
    "WF-010: response is missing a valid 'project' object. Got: " +
      JSON.stringify(body).slice(0, 300)
  );
}

if (!Array.isArray(body.tasks)) {
  throw new Error("WF-010: response 'tasks' is not an array.");
}

if (!Array.isArray(body.updates)) {
  throw new Error("WF-010: response 'updates' is not an array.");
}

return [{ json: body }];
```

A thrown `Error` inside a Code node fails that node (shown in red in the
n8n canvas, with the message visible in the execution log) and — because
"Continue On Fail" is off by default, and you should leave it off here —
stops the workflow. The AI node never runs. This is the literal mechanism
behind "stop the workflow and provide a clear error; do not send an error
response to AI as if it were project data."

---

## Node 5 — AI Project Summary

This is two nodes in n8n: a **model sub-node** (the credential + model
choice) feeding into the **chain node** (the actual prompt). This is
standard n8n structure for any LangChain-based AI call — the model isn't a
separate step in the main canvas, it's plugged into the chain node's "Model"
input.

### Node 5a — OpenAI Chat Model (sub-node)

| Field | Value |
|---|---|
| Node type | `@n8n/n8n-nodes-langchain.lmChatOpenAi` |
| Version | 1.3 |
| Name | `OpenAI Chat Model` |

| Field | Value |
|---|---|
| Credential | **reuse the existing OpenAI credential** already configured in this n8n instance for WF-001–WF-005, if one exists. Only create a new `openAiApi` credential if none does. |
| Model | `gpt-4o-mini` — this matches the application's own `AI_MODEL` env var (`src/lib/env.ts`), so the model doing the summarizing is consistent with the one the app itself uses for lead qualification. If your n8n instance already standardizes on a different model for WF-001–005, use that one instead for consistency with the rest of the automation suite — either choice is reasonable; just don't introduce a third, different model for this one workflow. |
| Options → Response Format | `json_object` — set `responsesApiEnabled` to **off** first (Options → "Whether to use the Responses API" → false), which exposes a simple **Response Format** dropdown; set it to `JSON`. This is a real constraint the OpenAI API enforces (rejects a response that isn't valid JSON), not just a prompt instruction — it backs up the system prompt's "Return valid JSON only" rather than relying on the model to comply voluntarily. |

### Node 5b — Basic LLM Chain (the actual "AI Project Summary" node)

| Field | Value |
|---|---|
| Node type | `@n8n/n8n-nodes-langchain.chainLlm` |
| Version | 1.9 |
| Name | `WF-010 AI Project Summary` |
| Model input | connect Node 5a's output to this node's **Model** connector (the small circular connector on top of the node, not the main data flow line) |

| Field | Value |
|---|---|
| Source for Prompt (User Message) | `Define below` (`promptType: "define"`) |
| Prompt (User Message) | `={{ JSON.stringify($json) }}` |

**That expression is the entire point of this task.** `$json` at this node
is Node 4's output — the real, validated `{ project, tasks, updates }`
object straight from the database. `JSON.stringify($json)` serializes the
actual data into the prompt. There is no `{{project}}`, `{{tasks}}`, or
`{{updates}}` anywhere in this workflow — those were never bound to
anything (that was the Prompt 28 finding); `{{ JSON.stringify($json) }}` is
a real n8n expression that resolves to real data every time this node runs.

**Messages → Add Message → System Message** (`messages.messageValues`,
type `SystemMessagePromptTemplate`):

```
You are an AI project management assistant.

Your task is to summarize the supplied project information.

Use ONLY the information supplied in the input.

Never invent facts.

Never assume missing information.

If information is unavailable, write "Not available".

Analyze:
1. Current project status
2. Overall project progress
3. Task completion
4. Pending tasks
5. Overdue tasks
6. Recent project updates
7. Risks
8. Upcoming deadlines
9. Recommended next actions

Recommendations must be based only on the supplied data.

Return valid JSON only.

Required structure:
{
  "project_summary": "",
  "status": "",
  "progress": {
    "total_tasks": 0,
    "completed_tasks": 0,
    "in_progress_tasks": 0,
    "pending_tasks": 0,
    "overdue_tasks": 0,
    "completion_percentage": 0
  },
  "key_updates": [],
  "risks": [],
  "upcoming_deadlines": [],
  "recommended_actions": []
}

Do not return Markdown.

Do not return explanations outside JSON.
```

Paste this verbatim — it's the system prompt exactly as specified, unmodified.

| Field | Value |
|---|---|
| Require Specific Output Format (`hasOutputParser`) | **leave unchecked/false** for this version — Node 6 below does the parsing and validation explicitly and separately, which is what this task asked for (a distinct "Structured Output" step you can inspect and debug on its own). See [Common Errors](#common-errors-and-fixes) for the alternative if you want n8n's built-in Structured Output Parser instead. |

---

## Node 6 — Structured Output

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.code` |
| Version | 2 |
| Name | `WF-010 Structured Output` |
| Mode | `Run Once for All Items` |
| Language | JavaScript |

**JavaScript code:**

```javascript
const item = $input.first().json;

// The Basic LLM Chain node's text output field name has varied across
// n8n versions ("text" is current as of chainLlm v1.9). Check the actual
// field name in this node's input pane after your first test run — if
// none of these three match, use whatever field actually holds the
// string there instead.
const raw = item.text ?? item.output ?? item.response?.text;

if (typeof raw !== "string" || raw.trim().length === 0) {
  throw new Error(
    "WF-010: AI node returned no text output. Input keys were: " +
      Object.keys(item).join(", ")
  );
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  throw new Error(
    "WF-010: AI response was not valid JSON. First 300 chars: " +
      raw.slice(0, 300)
  );
}

const requiredTopLevel = [
  "project_summary",
  "status",
  "progress",
  "key_updates",
  "risks",
  "upcoming_deadlines",
  "recommended_actions",
];
for (const field of requiredTopLevel) {
  if (!(field in parsed)) {
    throw new Error(`WF-010: AI response is missing required field "${field}".`);
  }
}

if (!parsed.progress || typeof parsed.progress !== "object") {
  throw new Error("WF-010: AI response 'progress' is missing or not an object.");
}

const requiredProgressFields = [
  "total_tasks",
  "completed_tasks",
  "in_progress_tasks",
  "pending_tasks",
  "overdue_tasks",
  "completion_percentage",
];
for (const field of requiredProgressFields) {
  if (typeof parsed.progress[field] !== "number") {
    throw new Error(`WF-010: progress.${field} is missing or not a number.`);
  }
}

const requiredArrayFields = ["key_updates", "risks", "upcoming_deadlines", "recommended_actions"];
for (const field of requiredArrayFields) {
  if (!Array.isArray(parsed[field])) {
    throw new Error(`WF-010: "${field}" must be an array.`);
  }
}

return [{ json: parsed }];
```

Same principle as Node 4: a malformed AI response throws here and the
workflow stops with a clear message, rather than silently passing a broken
or partial object to whatever consumes this workflow's result.

---

## Node 7 — Final Result

| Field | Value |
|---|---|
| Node type | `n8n-nodes-base.set` (Edit Fields) |
| Version | 3.5 |
| Name | `WF-010 Final Result` |
| Mode | `Manual Mapping` |

**Fields to Set:**

| Name | Type | Value (expression) |
|---|---|---|
| `Project Summary` | String | `={{ $json.project_summary }}` |
| `Status` | String | `={{ $json.status }}` |
| `Progress` | Object | `={{ $json.progress }}` |
| `Key Updates` | Array | `={{ $json.key_updates }}` |
| `Risks` | Array | `={{ $json.risks }}` |
| `Upcoming Deadlines` | Array | `={{ $json.upcoming_deadlines }}` |
| `Recommended Actions` | Array | `={{ $json.recommended_actions }}` |

Since this is a Manual Trigger workflow (no webhook to respond to), running
it and opening this node's output pane **is** "displaying the result" — no
additional Respond node is needed for v1. `Include Other Input Fields`
should stay **off** here, so this node's output is exactly these seven
labeled fields and nothing else (no leftover raw project/tasks/updates
data cluttering the final view).

**On writing the summary back to the app:** per this task's instructions,
v1 does **not** write the result back into the database — there is no
summary-storage field or write API for it yet (the `Lead` model has
`qualificationSummary`, but nothing analogous exists on `Project`), and
adding one would be a schema change out of scope for this task. This node
is the end of the workflow for now.

---

## Testing Procedure

Run these **in the n8n editor**, one at a time, using the "Test workflow"
button on the Manual Trigger. All six assume Prompt 29's endpoint has
actually been deployed (see [Prerequisite](#prerequisite--read-this-before-building-anything)).

| # | Setup | Steps | Expected result |
|---|---|---|---|
| **1** | Node 2's `projectId` = a real project that has at least one task | Run workflow | Node 3 returns 200; Node 4 passes; Node 7 shows a populated summary referencing that project's real title/status |
| **2** | Same project, but one with some `Task.status = "COMPLETED"` | Run workflow | Node 7's `Progress.completed_tasks` and `completion_percentage` reflect the actual completed/total ratio — cross-check against `/admin/projects/:id` in the app itself, or a direct `SELECT status, count(*) FROM "Task" WHERE "projectId" = '<id>' GROUP BY status;` |
| **3** | A project with at least one `Task` whose `dueDate` is in the past and `status != COMPLETED` | Run workflow | The AI's `risks` and/or `recommended_actions` mention the overdue task(s); nothing here is auto-computed by the app (there's no `overdue` boolean in the API response) — this is testing that the AI correctly derives "overdue" from `dueDate` vs. today's date, which the system prompt asks it to do from real data |
| **4** | A project with **zero** `ProjectMessage`/`Milestone`/recent `Task` activity (`updates: []` in the raw API response) | Run workflow | `key_updates` is `[]` or contains an entry saying "Not available" — **not** a fabricated update. If you see an invented-sounding update here, that's a prompt-adherence failure, not expected behavior — see Common Errors. |
| **5** | Node 2's `projectId` = a syntactically invalid value (not a UUID), e.g. `not-a-real-id` | Run workflow | Node 3 throws with a `400 Invalid project id.` (or a well-formed-but-nonexistent UUID → `404 Project not found.`) response body visible in n8n's error panel. Workflow stops at Node 3. **Node 5 (AI) does not execute** — confirm this by checking that node never turns green. |
| **6** | Temporarily break the credential — e.g. edit the Header Auth credential's Value to `wrong-value-on-purpose`, or clear it | Run workflow | Node 3 throws with a `401 Invalid n8n credentials.` (or `Missing n8n credentials.`) body. Workflow stops at Node 3. **Restore the correct credential value immediately after this test** so the workflow works again for future runs. |

For tests 5 and 6, the important assertion isn't just "it errored" — it's
that the **AI node's execution indicator never lights up**. Open the
execution log after each and confirm Node 5a/5b show as *not run*, not as
*ran and errored*.

---

## Common Errors and Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| Node 3 fails with `503 n8n integration is not configured on this server.` | The deployed app's `N8N_WEBHOOK_SECRET` env var isn't set in Vercel Production (flagged as unverified in `docs/28-existing-system-audit.md` §12 even before this task) | In the Vercel dashboard, set `N8N_WEBHOOK_SECRET` (and `N8N_WEBHOOK_URL`) for the Production environment, then redeploy |
| Node 3 fails with `401 Invalid n8n credentials.` even though the credential looks right | Trailing whitespace or a copy-paste truncation in the Header Auth credential's Value field; or the app's deployed `N8N_WEBHOOK_SECRET` was rotated after the credential was saved | Re-copy the exact value from the app's env config into the credential, no leading/trailing spaces |
| Node 3 fails with `404` and an **HTML** body (not `{"error": "Project not found."}` JSON) | The endpoint isn't deployed at all yet (see Prerequisite), or the URL has a typo (missing `/context`, wrong path segment order) | Confirm the deploy landed (`GET /api/leads` should 405, not 404, once it has); double-check the URL expression matches `.../api/n8n/projects/<id>/context` exactly |
| Node 5b's output has no usable text; Node 6 throws "AI node returned no text output" | The chain node's output field isn't named `text` in your n8n version, or `hasOutputParser` got toggled on without an Output Parser sub-node attached (which makes the chain fail before producing output) | Open Node 5b's output pane after a run, note the actual field name, update Node 6's `raw = item.text ?? ...` line to match; confirm `hasOutputParser` is off |
| Node 6 throws "AI response was not valid JSON" | The model wrapped the JSON in a Markdown code fence (```json ... ```) despite the prompt saying not to — some models do this occasionally even in JSON mode | In Node 6, strip fences before parsing: `const raw = (item.text ?? "").replace(/^```json\s*/i, "").replace(/```$/,"").trim();` — add this line before the `JSON.parse` call if you see this recurring |
| `key_updates`/`risks`/etc. contain plausible-sounding but wrong specifics (a task title that doesn't exist, a date that isn't real) | The model ignored "use ONLY the supplied information" — a prompt-adherence issue, more common on smaller/cheaper models | Re-run with a stronger model in Node 5a (e.g. a non-`mini` variant); if it persists, add a stricter reminder line to the system prompt: `"Every fact in your output must be traceable to a specific field in the input JSON."` |
| Progress numbers in the AI's output don't match what you see in `/admin/projects/:id` | The AI is asked to *compute* completion stats from the raw `tasks` array rather than being handed pre-computed numbers — if it miscounts, that's a model reasoning error, not a data error (the input data itself is real and correct, verified by Node 4) | For a more reliable v2, consider computing `progress` deterministically in Node 4/6 with plain JavaScript from `tasks`, and have the AI only fill in the qualitative fields (`project_summary`, `risks`, `recommended_actions`) — a small, optional hardening step, not required for this version |
| Workflow works when run manually but you're planning to switch the trigger later and want to test that now | Manual Trigger only fires from the "Test workflow" button, not automatically | See [Future: switching the trigger](#future-switching-the-trigger) below — don't build this yet, just know where it goes |

---

## Future: switching the trigger

Out of scope for this task (v1 is intentionally Manual Trigger only), noted
here only so the eventual change is a small, well-understood step rather
than a redesign:

- To fire on `PROJECT_UPDATED` (or `TASK_UPDATED`, `TASK_OVERDUE`, etc.):
  swap Node 1 for an `n8n-nodes-base.webhook` trigger node, and Node 2's
  static `projectId` field becomes `={{ $json.body.data.projectId }}` (or
  the equivalent path in whatever event payload the app sends — see
  `docs/n8n-integration.md` §4 for each event's exact payload shape from
  `src/lib/services/admin/projects.ts`'s `triggerN8nWebhook` calls). No
  other node in this workflow needs to change — Node 3 onward already
  reads `projectId` from whatever Node 2 produces, regardless of where
  Node 2 got it from.
- This is the same webhook mechanism WF-001 (Lead Capture) already uses —
  reuse that pattern rather than inventing a new one.

---

## Summary — what to actually do next

1. **Decide whether to deploy Prompt 29's work now** (see Prerequisite) —
   this is the one blocker, and it's a deployment step, not something to
   build in n8n.
2. Build Nodes 1–7 in n8n exactly as specified above.
3. Run Tests 1–6 in order.
4. Only after all six pass: consider this workflow (WF-010) done for v1.
   Writing the summary back into the app, and switching the trigger off
   Manual, are both explicitly future work, not part of this task.
