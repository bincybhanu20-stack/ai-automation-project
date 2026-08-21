/**
 * AI lead qualification.
 *
 * Field names here match the Lead model exactly (qualificationScore,
 * qualificationSummary, qualificationReason, aiProcessedAt) so a caller can
 * spread the result straight into a Prisma update:
 *
 *   const result = await qualifyLeadAI(lead);
 *   await prisma.lead.update({ where: { id: lead.id }, data: result });
 */

export interface LeadQualificationResult {
  qualificationScore: number; // 0-100
  qualificationSummary: string; // one-paragraph human-readable summary
  qualificationReason: string; // why the AI reached this score
  aiProcessedAt: Date;
  // AI only ever suggests these three LeadStatus values — PROPOSAL/WON are
  // human decisions the AI shouldn't make.
  suggestedStatus: "CONTACTED" | "QUALIFIED" | "LOST";
}

export async function qualifyLeadAI(lead: {
  name: string;
  email: string;
  company?: string | null;
  message: string;
}): Promise<LeadQualificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  // If OpenAI API key is configured, invoke OpenAI API
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI Lead Scoring Analyst. Analyze lead inquiries for business fit, intent, urgency, and company credibility. Return JSON format strictly: { \"qualificationScore\": number (0-100), \"qualificationSummary\": string, \"qualificationReason\": string, \"suggestedStatus\": \"CONTACTED\" | \"QUALIFIED\" | \"LOST\" }",
            },
            {
              role: "user",
              content: `Lead Name: ${lead.name}\nEmail: ${lead.email}\nCompany: ${lead.company || "N/A"}\nMessage: ${lead.message}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        const score = Math.min(100, Math.max(0, Number(content.qualificationScore) || 50));
        return {
          qualificationScore: score,
          qualificationSummary: content.qualificationSummary || "Lead analyzed via OpenAI engine.",
          qualificationReason: content.qualificationReason || "Automated scoring based on message content.",
          aiProcessedAt: new Date(),
          suggestedStatus: content.suggestedStatus || (score >= 70 ? "QUALIFIED" : score >= 40 ? "CONTACTED" : "LOST"),
        };
      }
    } catch (err) {
      console.warn("OpenAI API call failed, using intelligent fallback rules engine:", err);
    }
  }

  // Intelligent Fallback AI Qualification Engine (Deterministic Natural Language Processing Rules)
  let score = 50;
  const text = `${lead.name} ${lead.company || ""} ${lead.message}`.toLowerCase();
  const reasons: string[] = [];

  // Keyword intent signals
  const highIntentKeywords = ["budget", "enterprise", "automation", "project", "urgency", "implementation", "n8n", "ai", "platform", "saas", "client"];
  const lowIntentKeywords = ["free", "spam", "test", "demo only", "cheap"];

  highIntentKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      score += 8;
      reasons.push(`mentions "${kw}"`);
    }
  });

  lowIntentKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      score -= 15;
      reasons.push(`low-intent keyword "${kw}"`);
    }
  });

  if (lead.company && lead.company.trim().length > 2) {
    score += 15;
    reasons.push("company name provided");
  }

  if (lead.message.length > 80) {
    score += 10;
    reasons.push("detailed message");
  }

  score = Math.min(98, Math.max(15, score));
  const qualified = score >= 65;
  const suggestedStatus = qualified ? "QUALIFIED" : score >= 40 ? "CONTACTED" : "LOST";

  const summary = qualified
    ? `High-priority opportunity. Client intent score ${score}/100. Strong commercial fit detected for automation workflows.`
    : score >= 40
    ? `Moderate prospect. Score ${score}/100. Requires sales follow-up to clarify project timeline.`
    : `Low alignment prospect. Score ${score}/100. Short message or budget constraint detected.`;

  const reason =
    reasons.length > 0
      ? `Rules engine adjusted score based on: ${reasons.join(", ")}.`
      : "Rules engine found no strong signals; baseline score applied.";

  return {
    qualificationScore: score,
    qualificationSummary: summary,
    qualificationReason: reason,
    aiProcessedAt: new Date(),
    suggestedStatus,
  };
}
