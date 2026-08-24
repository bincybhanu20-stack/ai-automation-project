import { z } from "zod";

/**
 * Environment variable validation.
 *
 * WHY THIS FILE EXISTS:
 * Before this, `auth.ts` fell back to a hardcoded JWT secret if the env var was
 * missing. That is dangerous: if you deploy without setting JWT_SECRET, anyone
 * who knows the default string can forge a login session for any user.
 *
 * Now the app refuses to start with a bad configuration, and you get a clear
 * error message instead of a silent security hole.
 *
 * IMPORTANT: only import this file from server code (server components, server
 * actions, API routes). Never import it into a "use client" component, or the
 * secrets would be bundled into the browser.
 */

const envSchema = z.object({
  // --- Database ---
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (your PostgreSQL connection string)"),

  // --- Authentication ---
  // 32 characters minimum: a short secret can be brute-forced.
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  // --- n8n automation (optional in Phase 1, used from Phase 8) ---
  N8N_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),
  N8N_WEBHOOK_SECRET: z.string().optional().or(z.literal("")),
  // Each n8n workflow has its own distinct webhook URL — this one routes
  // TASK_CREATED to WF-003 specifically instead of N8N_WEBHOOK_URL (which
  // points at WF-001). Optional: when unset, TASK_CREATED simply isn't
  // attempted (src/lib/services/admin/tasks.ts), same as any other
  // unconfigured webhook.
  N8N_TASK_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),

  // --- Scheduled automation (Vercel Cron) ---
  // Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on
  // cron-triggered requests when a variable with EXACTLY this name is set
  // on the project. See src/lib/n8n-auth.ts verifyCronSecret().
  CRON_SECRET: z.string().optional().or(z.literal("")),

  // --- AI (optional: ai.ts falls back to a rules engine when absent) ---
  OPENAI_API_KEY: z.string().optional().or(z.literal("")),
  AI_MODEL: z.string().optional().or(z.literal("")),

  // --- App ---
  // NEXT_PUBLIC_ prefix means this one IS visible in the browser. That is fine:
  // it is only a URL, never a secret.
  NEXT_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Build a readable list like: "JWT_SECRET: must be at least 32 characters"
    const problems = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n Invalid environment variables:\n${problems}\n\n` +
        `Fix these in your .env file, then restart the dev server.\n`
    );
  }

  return parsed.data;
}

export const env = loadEnv();

/**
 * True when the AI provider is configured. When false, `ai.ts` uses its
 * built-in deterministic scoring rules, so the app still works end to end.
 */
export const isAIConfigured = Boolean(env.OPENAI_API_KEY?.trim());

/**
 * True when n8n is configured. When false, automation calls are skipped
 * instead of throwing.
 */
export const isN8NConfigured = Boolean(
  env.N8N_WEBHOOK_URL?.trim() && env.N8N_WEBHOOK_SECRET?.trim()
);

/**
 * True when a shared secret is set for authenticating n8n's INBOUND calls
 * into this app (src/lib/n8n-auth.ts) and Vercel Cron's scheduled calls
 * (CRON_SECRET). Split from isN8NConfigured because the outbound webhook
 * URL is irrelevant to whether inbound calls can be verified.
 */
export const isN8NInboundConfigured = Boolean(env.N8N_WEBHOOK_SECRET?.trim());
export const isCronConfigured = Boolean(env.CRON_SECRET?.trim());
