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
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { requireAdmin } from "@/lib/admin-guard";
import { getDashboardStats } from "@/lib/services/admin/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Admin Dashboard" };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total Leads", value: stats.totalLeads, icon: UserPlus, href: "/admin/leads" },
    { label: "New Leads", value: stats.newLeads, icon: BadgeCheck, href: "/admin/leads?status=NEW" },
    { label: "Qualified Leads", value: stats.qualifiedLeads, icon: Sparkles, href: "/admin/leads?status=QUALIFIED" },
    { label: "Active Clients", value: stats.activeClients, icon: Users2, href: "/admin/clients" },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, href: "/admin/projects" },
    { label: "Open Tasks", value: stats.openTasks, icon: CheckSquare, href: "/admin/tasks" },
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
      <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">Live platform overview.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
