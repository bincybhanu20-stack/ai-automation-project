import { prisma } from "./prisma";
import { env, isN8NConfigured } from "./env";

interface TriggerParams {
  /** e.g. "LEAD_CREATED" — becomes both the AutomationRun's workflowName and the event name n8n receives. */
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(env.N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Shared secret so n8n can verify the request actually came from
        // this app, not an arbitrary caller who found the webhook URL.
        "X-Webhook-Secret": env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify({ event: eventType, entityType, entityId, data: payload }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`n8n responded with HTTP ${response.status}`);
    }

    const executionId = response.headers.get("x-n8n-execution-id") ?? undefined;

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

    console.error(`n8n webhook trigger failed for ${eventType}/${entityId}:`, message);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}
