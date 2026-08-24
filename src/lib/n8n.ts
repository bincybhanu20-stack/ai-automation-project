import { prisma } from "./prisma";
import { env, isN8NConfigured } from "./env";

interface TriggerParams {
  /** e.g. "LEAD_CREATED" — becomes both the AutomationRun's workflowName and the event name n8n receives. */
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  /**
   * When set, sent as the exact JSON request body instead of the default
   * `{ event, entityType, entityId, data: payload }` envelope. Some n8n
   * workflows (e.g. WF-001) are built to expect a specific top-level shape
   * (`{ event: "lead.created", lead: {...} }`) rather than the generic one —
   * this lets a call site match that exactly without changing the envelope
   * every other event still relies on.
   */
  body?: Record<string, unknown>;
}

/** Logs only the webhook URL's host+path — never the secret or full query string. */
function safeUrlForLogging(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "(invalid URL)";
  }
}

/**
 * Fires an n8n webhook for a business event and records the attempt.
 *
 * SECURITY: N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET are read from env.ts,
 * which only ever runs in server code. This function is never imported by
 * a "use client" component, so these values never reach the browser bundle.
 *
 * RELIABILITY: every call — configured or not, success or failure — writes
 * an AutomationRun row, so that table is an honest record of what should
 * have fired, not just what did. The idempotencyKey means calling this
 * twice for the same event+entity (e.g. a retried request) updates the
 * same row instead of creating a duplicate.
 *
 * This function NEVER throws. A failed or unconfigured webhook is logged
 * to AutomationRun and swallowed — the caller's database write already
 * succeeded and remains the source of truth regardless of automation
 * outcome.
 */
export async function triggerN8nWebhook({
  eventType,
  entityType,
  entityId,
  payload,
  body,
}: TriggerParams): Promise<string | undefined> {
  const idempotencyKey = `${eventType}-${entityId}`;

  const run = await prisma.automationRun.upsert({
    where: { idempotencyKey },
    update: {},
    create: {
      workflowName: eventType,
      entityType,
      entityId,
      status: "PENDING",
      idempotencyKey,
    },
  });

  if (!isN8NConfigured) {
    console.error(
      `[n8n] not attempted for ${eventType}/${entityId} (run ${run.id}): N8N_WEBHOOK_URL/N8N_WEBHOOK_SECRET unset`
    );
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: "n8n is not configured (N8N_WEBHOOK_URL/N8N_WEBHOOK_SECRET unset)",
        completedAt: new Date(),
      },
    });
    return undefined;
  }

  const targetUrl = env.N8N_WEBHOOK_URL!;
  console.log(
    `[n8n] attempting ${eventType}/${entityId} (run ${run.id}) -> ${safeUrlForLogging(targetUrl)}`
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Shared secret so n8n can verify the request actually came from
        // this app, not an arbitrary caller who found the webhook URL. Must
        // be "X-N8N-Secret" — that's the exact header name n8n's Header
        // Auth credential on the webhook trigger node is configured to
        // check (same name used on the inbound side, src/lib/n8n-auth.ts).
        "X-N8N-Secret": env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify(body ?? { event: eventType, entityType, entityId, data: payload }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`n8n responded with HTTP ${response.status}`);
    }

    const executionId = response.headers.get("x-n8n-execution-id") ?? undefined;

    console.log(
      `[n8n] success for ${eventType}/${entityId} (run ${run.id}): HTTP ${response.status}${executionId ? `, executionId=${executionId}` : ""}`
    );

    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: "SUCCESS", executionId: executionId ?? null, completedAt: new Date() },
    });

    return executionId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errorMessage: message, completedAt: new Date() },
    });

    console.error(`[n8n] failed for ${eventType}/${entityId} (run ${run.id}):`, message);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}
