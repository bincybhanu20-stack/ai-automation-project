import { NextResponse } from "next/server";
import { verifyN8nSecret } from "@/lib/n8n-auth";
import { leadQualificationResultSchema } from "@/lib/validations/n8n";
import { saveLeadQualificationResult } from "@/lib/services/n8n/lead-qualification";

/**
 * POST /api/leads/qualification-result — write-back endpoint for WF-001's
 * "Send Result to App API" node, which previously pointed at a placeholder
 * URL (docs/n8n-integration.md). This is the n8n -> app direction of the
 * LEAD_CREATED integration; src/lib/services/leads.ts (app -> n8n) is
 * unrelated and unchanged.
 *
 * Auth: verifyN8nSecret — same shared secret/header as every other n8n ->
 * app endpoint (src/lib/n8n-auth.ts).
 */
export async function POST(request: Request) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const parsed = leadQualificationResultSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return NextResponse.json({ error: "Invalid request body.", fieldErrors }, { status: 400 });
  }

  try {
    const result = await saveLeadQualificationResult(parsed.data);

    if (!result) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      leadId: result.id,
      processedAt: result.aiProcessedAt,
    });
  } catch (error) {
    console.error("Failed to save lead qualification result:", error);
    return NextResponse.json({ error: "Something went wrong on our end." }, { status: 500 });
  }
}
