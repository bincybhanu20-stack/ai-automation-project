import type { Metadata } from "next";
import {
  UserPlus,
  Sparkles,
  Users2,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Workflow,
  BadgeCheck,
  Plus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatCard } from "@/components/admin/ui/StatCard";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { DonutChart } from "@/components/admin/ui/DonutChart";
import { requireAdmin } from "@/lib/admin-guard";
import { getDashboardStats, getDashboardBreakdowns } from "@/lib/services/admin/dashboard";
import { getReportMetrics } from "@/lib/services/admin/reports";

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: "#94A3B8",
  CONTACTED: "#38BDF8",
  QUALIFIED: "#818CF8",
  PROPOSAL: "#A78BFA",
  WON: "#34D399",
  LOST: "#DE0000",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  TODO: "#94A3B8",
  IN_PROGRESS: "#38BDF8",
  REVIEW: "#A78BFA",
  COMPLETED: "#34D399",
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  PLANNING: "#94A3B8",
  ACTIVE: "#38BDF8",
  ON_HOLD: "#FBBF24",
  COMPLETED: "#34D399",
  CANCELLED: "#DE0000",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "#DE0000",
  PROJECT_MANAGER: "#A78BFA",
  TEAM_MEMBER: "#38BDF8",
  CLIENT: "#34D399",
};

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Admin Dashboard" };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, { leadsByStatus, totalLeads }, { tasksByStatus, projectsByStatus, usersByRole }] = await Promise.all([
    getDashboardStats(),
    getReportMetrics(),
    getDashboardBreakdowns(),
  ]);

  const leadDonutData = leadsByStatus.map((row) => ({
    label: titleCase(row.status),
    value: row.count,
    color: LEAD_STATUS_COLORS[row.status] ?? "#94A3B8",
  }));

  const taskDonutData = tasksByStatus.map((row) => ({
    label: titleCase(row.status),
    value: row.count,
    color: TASK_STATUS_COLORS[row.status] ?? "#94A3B8",
  }));

  const projectDonutData = projectsByStatus.map((row) => ({
    label: titleCase(row.status),
    value: row.count,
    color: PROJECT_STATUS_COLORS[row.status] ?? "#94A3B8",
  }));

  const roleDonutData = usersByRole.map((row) => ({
    label: titleCase(row.role),
    value: row.count,
    color: ROLE_COLORS[row.role] ?? "#94A3B8",
  }));

  const totalTasks = taskDonutData.reduce((sum, d) => sum + d.value, 0);
  const totalProjects = projectDonutData.reduce((sum, d) => sum + d.value, 0);
  const totalActiveUsers = roleDonutData.reduce((sum, d) => sum + d.value, 0);

  const cards = [
    { label: "Total Leads", value: stats.totalLeads, icon: UserPlus, href: "/admin/leads", accent: "sky" as const },
    { label: "New Leads", value: stats.newLeads, icon: BadgeCheck, href: "/admin/leads?status=NEW", accent: "sky" as const },
    { label: "Qualified Leads", value: stats.qualifiedLeads, icon: Sparkles, href: "/admin/leads?status=QUALIFIED", accent: "sky" as const },
    { label: "Active Clients", value: stats.activeClients, icon: Users2, href: "/admin/clients", accent: "emerald" as const },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, href: "/admin/projects", accent: "violet" as const },
    { label: "Open Tasks", value: stats.openTasks, icon: CheckSquare, href: "/admin/tasks", accent: "amber" as const },
    {
      label: "Overdue Tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      href: "/admin/tasks",
      tone: "warning" as const,
    },
    {
      label: "Automation Failures",
      value: stats.automationFailures,
      icon: Workflow,
      href: "/admin/automations?status=FAILED",
      tone: "warning" as const,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">Dashboard</h1>
          <p className="mt-1 text-sm text-charcoal-muted">Live platform overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/tasks/new">
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add New Task
            </Button>
          </Link>
          <Link href="/admin/tasks">
            <Button size="sm" variant="secondary">
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              Manage Tasks
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button size="sm" variant="secondary">
              <Users className="h-4 w-4" aria-hidden="true" />
              Manage Users
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Lead pipeline"
            description="Live breakdown of every lead by status."
            action={
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-1 text-sm font-medium text-crimson hover:text-crimson-hover"
              >
                Full reports
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          {totalLeads === 0 ? (
            <p className="text-sm text-charcoal-muted">No leads yet.</p>
          ) : (
            <DonutChart data={leadDonutData} centerLabel="Leads" />
          )}
        </Card>

        <Card>
          <CardHeader title="Tasks by status" description="Live breakdown of every task, across all projects." />
          {totalTasks === 0 ? (
            <p className="text-sm text-charcoal-muted">No tasks yet.</p>
          ) : (
            <DonutChart data={taskDonutData} centerLabel="Tasks" />
          )}
        </Card>

        <Card>
          <CardHeader title="Projects by status" description="Live breakdown of every project." />
          {totalProjects === 0 ? (
            <p className="text-sm text-charcoal-muted">No projects yet.</p>
          ) : (
            <DonutChart data={projectDonutData} centerLabel="Projects" />
          )}
        </Card>

        <Card>
          <CardHeader title="Team by role" description="Active users, grouped by role." />
          {totalActiveUsers === 0 ? (
            <p className="text-sm text-charcoal-muted">No active users yet.</p>
          ) : (
            <DonutChart data={roleDonutData} centerLabel="Users" />
          )}
        </Card>
      </div>
    </div>
  );
}
