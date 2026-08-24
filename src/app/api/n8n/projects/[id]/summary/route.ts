import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyN8nSecret } from "@/lib/n8n-auth";
import { aiProjectSummarySchema } from "@/lib/validations/n8n";
import { saveProjectAiSummary } from "@/lib/services/n8n/project-summary";

/**
 * POST /api/n8n/projects/:id/summary — write-back endpoint for WF-010's AI
 * project summary. The read half (GET .../context) is untouched by this
 * file; this is the other direction of the same n8n integration.
 *
 * Auth: verifyN8nSecret — the SAME shared secret and header as the context
 * endpoint (src/lib/n8n-auth.ts). No second auth mechanism.
 */

const idSchema = z.string().uuid();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authError = verifyN8nSecret(request);
  if (authError) return authError;

  const parsedId = idSchema.safeParse(params.id);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid project id." }, { status: 400 });
  }
  const projectId = parsedId.data;

  const body = await request.json().catch(() => null);
  const parsedBody = aiProjectSummarySchema.safeParse(body);

  if (!parsedBody.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsedBody.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return NextResponse.json(
      { error: "Invalid request body.", fieldErrors },
      { status: 400 }
    );
  }

  try {
    const result = await saveProjectAiSummary(projectId, parsedBody.data);

    if (!result) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      projectId: result.id,
      generatedAt: result.aiSummaryGeneratedAt,
    });
  } catch (error) {
    // Never leak internals (query text, stack traces, connection strings)
    // to the caller — same principle as POST /api/leads.
    console.error("Failed to save AI project summary:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end." },
      { status: 500 }
    );
  }
}
