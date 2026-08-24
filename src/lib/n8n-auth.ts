import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { env, isN8NInboundConfigured, isCronConfigured } from "./env";

/**
 * Inbound server-to-server authentication for n8n -> this app.
 *
 * This is DELIBERATELY separate from src/lib/auth.ts (which is the JWT
 * cookie session for human users). n8n is not a user — it never logs in,
 * never gets a session cookie, and must never be able to obtain one. It
 * proves itself with a single shared secret, the SAME secret already used
 * in the outbound direction (src/lib/n8n.ts sends it as X-Webhook-Secret
 * when calling n8n). Reusing N8N_WEBHOOK_SECRET rather than inventing a
 * second env var keeps "the shared trust between this app and n8n" as one
 * value to configure in both places, not two.
 *
 * SECURITY: comparison is constant-time. A naive `provided === secret`
 * leaks timing information proportional to how many leading characters
 * match, which an attacker can exploit to guess the secret one character
 * at a time. Hashing both sides to a fixed-length digest first also means
 * we never leak the secret's length via timingSafeEqual's own
 * "throws on length mismatch" behavior.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

const N8N_SECRET_HEADER = "x-n8n-secret";

/**
 * Call at the top of any Route Handler that n8n calls into this app.
 * Returns `null` when the request is authorized (caller proceeds); returns
 * a ready-to-return NextResponse error otherwise. Never throws.
 *
 * On the n8n side, the HTTP Request node must send:
 *   Header name:  X-N8N-Secret
 *   Header value: {{ $env.N8N_WEBHOOK_SECRET }} (or a credential/expression
 *                 holding the same value configured in this app's
 *                 N8N_WEBHOOK_SECRET environment variable)
 * See docs/n8n-integration.md for the full HTTP Request node configuration.
 */
export function verifyN8nSecret(request: Request): NextResponse | null {
  if (!isN8NInboundConfigured) {
    // Same posture as the outbound direction (src/lib/n8n.ts): if the
    // integration isn't configured at all, there is no secret to check
    // against, so every inbound call is refused rather than silently
    // trusted.
    return NextResponse.json(
      { error: "n8n integration is not configured on this server." },
      { status: 503 }
    );
  }

  const provided = request.headers.get(N8N_SECRET_HEADER);
  if (!provided) {
    return NextResponse.json({ error: "Missing n8n credentials." }, { status: 401 });
  }

  if (!constantTimeEqual(provided, env.N8N_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: "Invalid n8n credentials." }, { status: 401 });
  }

  return null;
}

/**
 * Call at the top of any scheduled Route Handler (Vercel Cron). Vercel
 * automatically attaches `Authorization: Bearer <CRON_SECRET>` to
 * cron-triggered requests when an env var named exactly CRON_SECRET is set
 * on the project — see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
 * This is the platform's own mechanism, not a custom scheme, so nothing
 * else needs to be configured to make the header arrive.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  if (!isCronConfigured) {
    return NextResponse.json(
      { error: "Scheduled automation is not configured on this server." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing cron credentials." }, { status: 401 });
  }

  const provided = authHeader.replace(/^Bearer\s+/i, "");
  if (!constantTimeEqual(provided, env.CRON_SECRET!)) {
    return NextResponse.json({ error: "Invalid cron credentials." }, { status: 401 });
  }

  return null;
}

// Exported for tests only — not part of the module's functional API.
export const __internal = { constantTimeEqual, N8N_SECRET_HEADER };
