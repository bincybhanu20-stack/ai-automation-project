import { NextResponse } from "next/server";
import { createLeadSchema } from "@/lib/validations/leads";
import { createLeadFromPublicForm } from "@/lib/services/leads";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSameOriginRequest } from "@/lib/csrf";

/**
 * POST /api/leads — public lead capture endpoint (no authentication
 * required; this is what the public site's forms submit to).
 *
 * Order of operations matches the stated requirements exactly:
 *  1-4. validate, sanitize, validate email, validate required fields
 *       (all via createLeadSchema.safeParse — one shared definition, so
 *       what's enforced here can never drift from what the Lead model
 *       actually requires)
 *  5-10. duplicate check, create, status/source, return success, trigger
 *       n8n — all in src/lib/services/leads.ts, in that order
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const ip = getClientIp(request);

  // Spam/abuse protection, independent of the honeypot below: even a bot
  // that leaves the honeypot empty can't flood the endpoint.
  const limit = checkRateLimit(`lead-submit:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions from this network. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    // Field-level errors so the form can show them next to the right
    // input, not just a generic banner.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return NextResponse.json(
      { error: "Please fix the errors below.", fieldErrors },
      { status: 400 }
    );
  }

  // Honeypot tripped: respond exactly like a real success, but never touch
  // the database. A bot that gets a normal-looking success response has no
  // signal to learn from and adapt to.
  if (parsed.data.website) {
    // Same status code AND body shape as a real success below — a bot
    // checking either the status or the response text has no way to tell
    // it was caught.
    return NextResponse.json(
      {
        success: true,
        message: "Thanks! Your request has been received. We'll be in touch shortly.",
      },
      { status: 201 }
    );
  }

  try {
    const result = await createLeadFromPublicForm(parsed.data, { ipAddress: ip });

    // 201 for a genuinely new record; 200 for the idempotent duplicate case
    // (the request succeeded, but nothing new was created) — standard REST
    // semantics, and `duplicate` in the body lets any caller that cares
    // distinguish the two without relying on the status code alone. The
    // public form itself only checks response.ok, which is true for both.
    return NextResponse.json(
      {
        success: true,
        duplicate: result.status === "duplicate",
        message:
          result.status === "duplicate"
            ? "We've already received your inquiry and will be in touch shortly."
            : "Thanks! Your request has been received. We'll be in touch shortly.",
      },
      { status: result.status === "duplicate" ? 200 : 201 }
    );
  } catch (error) {
    // Never leak internals (query text, stack traces, connection strings)
    // to the browser — log the real error server-side only.
    console.error("Failed to create lead:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end. Please try again in a moment." },
      { status: 500 }
    );
  }
}
