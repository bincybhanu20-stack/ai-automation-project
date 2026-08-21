export interface LeadQualificationResult {
  aiQualified: boolean;
  aiScore: number; // 0 - 100
  aiSummary: string;
  aiSuggestedRole: string;
  status: "QUALIFIED" | "QUALIFYING" | "DISQUALIFIED";
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
                "You are an AI Lead Scoring Analyst. Analyze lead inquiries for business fit, intent, urgency, and company credibility. Return JSON format strictly: { \"aiQualified\": boolean, \"aiScore\": number (0-100), \"aiSummary\": string, \"aiSuggestedRole\": string, \"status\": \"QUALIFIED\" | \"QUALIFYING\" | \"DISQUALIFIED\" }",
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
        return {
          aiQualified: Boolean(content.aiQualified),
          aiScore: Math.min(100, Math.max(0, Number(content.aiScore) || 50)),
          aiSummary: content.aiSummary || "Lead analyzed via OpenAI engine.",
          aiSuggestedRole: content.aiSuggestedRole || "Potential Enterprise Client",
          status: content.status || (content.aiScore >= 70 ? "QUALIFIED" : "QUALIFYING"),
        };
      }
    } catch (err) {
      console.warn("OpenAI API call failed, using intelligent fallback rules engine:", err);
    }
  }

  // Intelligent Fallback AI Qualification Engine (Deterministic Natural Language Processing Rules)
  let score = 50;
  const text = `${lead.name} ${lead.company || ""} ${lead.message}`.toLowerCase();
  
  // Keyword intent signals
  const highIntentKeywords = ["budget", "enterprise", "automation", "project", "urgency", "implementation", "n8n", "ai", "platform", "saas", "client"];
  const lowIntentKeywords = ["free", "spam", "test", "demo only", "cheap"];

  highIntentKeywords.forEach((kw) => {
    if (text.includes(kw)) score += 8;
  });

  lowIntentKeywords.forEach((kw) => {
    if (text.includes(kw)) score -= 15;
  });

  if (lead.company && lead.company.trim().length > 2) {
    score += 15;
  }

  if (lead.message.length > 80) {
    score += 10;
  }

  score = Math.min(98, Math.max(15, score));
  const qualified = score >= 65;
  const status = qualified ? "QUALIFIED" : score >= 40 ? "QUALIFYING" : "DISQUALIFIED";

  const summary = qualified
    ? `High-priority opportunity. Client intent score ${score}/100. Strong commercial fit detected for automation workflows.`
    : score >= 40
    ? `Moderate prospect. Score ${score}/100. Requires sales follow-up to clarify project timeline.`
    : `Low alignment prospect. Score ${score}/100. Short message or budget constraint detected.`;

  return {
    aiQualified: qualified,
    aiScore: score,
    aiSummary: summary,
    aiSuggestedRole: qualified ? "Enterprise Client" : "Standard Lead",
    status,
  };
}
