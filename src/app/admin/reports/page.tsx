import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-guard";
import { getReportMetrics } from "@/lib/services/admin/reports";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Reports" };
}

export const dynamic = "force-dynamic";

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value}</span>
    </div>
  );
}

function BreakdownBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <StatusBadge value={label} />
        <span className="text-slate-400">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function AdminReportsPage() {
  await requireAdmin();
  const m = await getReportMetrics();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Reports</h1>
      <p className="mt-1 text-sm text-slate-400">Live metrics computed from the current database.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leads" />
          <MetricRow label="Total leads" value={String(m.totalLeads)} />
          <MetricRow label="Won" value={String(m.wonLeads)} />
          <MetricRow label="Conversion rate" value={`${m.conversionRate}%`} />
        </Card>

        <Card>
          <CardHeader title="Projects & Tasks" />
          <MetricRow label="Total projects" value={String(m.totalProjects)} />
          <MetricRow label="Completed projects" value={`${m.completedProjects} (${m.projectCompletionRate}%)`} />
          <MetricRow label="Total tasks" value={String(m.totalTasks)} />
          <MetricRow label="Completed tasks" value={`${m.completedTasks} (${m.taskCompletionRate}%)`} />
          <MetricRow label="Overdue tasks" value={String(m.overdueTasks)} />
        </Card>

        <Card>
          <CardHeader title="Leads by status" />
          <div className="space-y-3">
            {m.leadsByStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet.</p>
            ) : (
              m.leadsByStatus.map((row) => (
                <BreakdownBar key={row.status} label={row.status} count={row.count} total={m.totalLeads} />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Leads by source" />
          <div className="space-y-3">
            {m.leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet.</p>
            ) : (
              m.leadsBySource.map((row) => (
                <BreakdownBar key={row.source} label={row.source} count={row.count} total={m.totalLeads} />
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Automation" />
          <MetricRow label="Total runs" value={String(m.totalAutomationRuns)} />
          <MetricRow label="Successful" value={String(m.successfulAutomationRuns)} />
          <MetricRow label="Failed" value={String(m.failedAutomationRuns)} />
          <MetricRow label="Success rate" value={`${m.automationSuccessRate}%`} />
        </Card>
      </div>
    </div>
  );
}
