import type { Metadata } from "next";
import { CheckCircle2, MinusCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { isAIConfigured, isN8NConfigured, env } from "@/lib/env";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Settings" };
}

export const dynamic = "force-dynamic";

/**
 * This is deliberately a READ-ONLY status page, not a settings form.
 * There is no Settings table backing this platform yet, and a form that
 * doesn't actually persist anywhere would be exactly the kind of fake data
 * this build explicitly avoids. What's shown here is real, live
 * configuration state — the same checks env.ts already enforces at
 * startup, plus real counts from the database.
 */
export default async function AdminSettingsPage() {
  await requireAdmin();

  const [userCount, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  const rows = [
    { label: "AI qualification provider", configured: isAIConfigured, detail: isAIConfigured ? `Model: ${env.AI_MODEL || "default"}` : "Using built-in rules-based fallback" },
    { label: "n8n automation webhook", configured: isN8NConfigured, detail: isN8NConfigured ? "Webhook URL and secret configured" : "Not configured — automation runs are logged as failed" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-charcoal-dark">Settings</h1>
      <p className="mt-1 text-sm text-charcoal-muted">Live system configuration.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Integrations" description="Configured via server-side environment variables." />
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start gap-3">
                {row.configured ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                ) : (
                  <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-muted" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm font-medium text-charcoal-dark">{row.label}</p>
                  <p className="text-xs text-charcoal-muted">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Platform" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-hairline py-2">
              <span className="text-charcoal-muted">Total users</span>
              <span className="text-charcoal-dark">{userCount}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-charcoal-muted">Admin accounts</span>
              <span className="text-charcoal-dark">{adminCount}</span>
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-charcoal-muted">
        User management, role changes and integration credentials are configured
        via environment variables and the seed script for now — a dedicated
        settings/user-management module is future work.
      </p>
    </div>
  );
}
