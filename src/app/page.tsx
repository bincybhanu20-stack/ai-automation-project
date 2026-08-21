import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { isAIConfigured, isN8NConfigured } from "@/lib/env";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

/**
 * Phase 1 home page.
 *
 * This is a temporary page whose job is to PROVE the foundation works:
 * database connection, Prisma client, environment validation and Tailwind.
 * Phase 3 replaces it with the real marketing home page.
 *
 * This is a Server Component, so the database query below runs on the server.
 * The connection string is never sent to the browser.
 */

// Always run fresh — never serve a cached status.
export const dynamic = "force-dynamic";

type CheckState = "ok" | "fail" | "optional";

async function getSystemStatus() {
  try {
    // A trivial query that proves we can actually reach PostgreSQL.
    const userCount = await prisma.user.count();
    return { dbConnected: true as const, userCount, error: null };
  } catch (error) {
    // Log the real reason server-side only.
    console.error("Database connection check failed:", error);
    return { dbConnected: false as const, userCount: 0, error: "unreachable" };
  }
}

function StatusRow({
  label,
  state,
  detail,
}: {
  label: string;
  state: CheckState;
  detail: string;
}) {
  const icons = {
    ok: <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
    fail: <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />,
    optional: <MinusCircle className="h-5 w-5 text-slate-500" aria-hidden="true" />,
  };

  return (
    <li className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <div className="flex items-center gap-3">
        {icons[state]}
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <span className="text-right text-xs text-slate-400">{detail}</span>
    </li>
  );
}

export default async function HomePage() {
  const status = await getSystemStatus();

  return (
    <main className="flex min-h-screen items-center py-16">
      <Container size="narrow">
        <div className="mb-10 text-center">
          <h1 className="gradient-text text-4xl font-bold sm:text-5xl">
            ClientFlow
          </h1>
          <p className="mt-3 text-slate-400">
            Client Management &amp; AI Automation Platform
          </p>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-600">
            Phase 1 · Foundation
          </p>
        </div>

        <Card>
          <CardHeader
            title="System status"
            description="Live check that the foundation is wired up correctly."
          />

          <ul>
            <StatusRow
              label="PostgreSQL database"
              state={status.dbConnected ? "ok" : "fail"}
              detail={
                status.dbConnected
                  ? `Connected · ${status.userCount} user${status.userCount === 1 ? "" : "s"}`
                  : "Cannot connect — check DATABASE_URL"
              }
            />
            <StatusRow
              label="Prisma ORM"
              state={status.dbConnected ? "ok" : "fail"}
              detail={status.dbConnected ? "Client generated" : "Run: npm run db:migrate"}
            />
            <StatusRow
              label="Environment variables"
              state="ok"
              detail="Validated at startup"
            />
            <StatusRow
              label="AI provider"
              state={isAIConfigured ? "ok" : "optional"}
              detail={
                isAIConfigured
                  ? "API key configured"
                  : "Not set — using built-in rules engine"
              }
            />
            <StatusRow
              label="n8n automation"
              state={isN8NConfigured ? "ok" : "optional"}
              detail={isN8NConfigured ? "Webhook configured" : "Configured in Phase 8"}
            />
          </ul>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-600">
          Next up: Phase 2 — authentication, login and role-based access.
        </p>
      </Container>
    </main>
  );
}
