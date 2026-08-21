import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderKanban, CheckSquare, AlertTriangle, Bell } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatCard } from "@/components/admin/ui/StatCard";
import { DonutChart } from "@/components/admin/ui/DonutChart";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { NotificationMarkReadButton } from "@/components/manager/NotificationMarkReadButton";
import { requireRoleForPage } from "@/lib/page-guards";
import { getManagerDashboardData } from "@/lib/services/manager/dashboard";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Staff Dashboard" };
export const dynamic = "force-dynamic";

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

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}

export default async function ManagerPage() {
  // Internal staff area: ADMIN, PROJECT_MANAGER and TEAM_MEMBER. A CLIENT
  // hitting this route is redirected to /unauthorized — enforced here, not
  // just by middleware.
  const session = await requireRoleForPage(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]);
  const data = await getManagerDashboardData(session.userId);

  const taskDonutData = data.tasksByStatus.map((row) => ({
    label: titleCase(row.status),
    value: row.count,
    color: TASK_STATUS_COLORS[row.status] ?? "#94A3B8",
  }));
  const totalTasks = taskDonutData.reduce((sum, d) => sum + d.value, 0);

  const projectDonutData = data.projectsByStatus.map((row) => ({
    label: titleCase(row.status),
    value: row.count,
    color: PROJECT_STATUS_COLORS[row.status] ?? "#94A3B8",
  }));
  const totalManagedProjects = projectDonutData.reduce((sum, d) => sum + d.value, 0);

  const canManageProjects = session.role === "ADMIN" || session.role === "PROJECT_MANAGER";

  return (
    <main className="min-h-screen bg-white py-12">
      <Container size="wide">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-dark">
              Welcome back, {session.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-charcoal-muted">
              Signed in as <span className="text-charcoal-dark">{session.name}</span> ·{" "}
              <span className="text-charcoal-dark">{session.role.replace("_", " ")}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canManageProjects && (
              <Link
                href="/admin/projects"
                className="inline-flex items-center gap-1.5 rounded-lg bg-crimson px-5 py-2.5 text-sm font-medium text-white hover:bg-crimson-hover"
              >
                Manage Projects
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Projects You Manage" value={data.projectsManaged} icon={FolderKanban} accent="violet" />
          <StatCard label="Tasks Assigned to You" value={data.tasksAssigned} icon={CheckSquare} accent="amber" />
          <StatCard label="Overdue Tasks" value={data.overdueTasks} icon={AlertTriangle} tone="warning" />
          <StatCard label="Unread Notifications" value={data.unreadNotifications} icon={Bell} accent="indigo" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Your tasks by status" description="Live breakdown of tasks assigned to you." />
            {totalTasks === 0 ? (
              <p className="text-sm text-charcoal-muted">No tasks assigned to you yet.</p>
            ) : (
              <DonutChart data={taskDonutData} centerLabel="Tasks" />
            )}
          </Card>

          <Card>
            <CardHeader title="Your projects by status" description="Live breakdown of projects you manage." />
            {!canManageProjects ? (
              <p className="text-sm text-charcoal-muted">
                Project management isn&apos;t part of your role — this fills in once you&apos;re assigned as a
                project manager.
              </p>
            ) : totalManagedProjects === 0 ? (
              <p className="text-sm text-charcoal-muted">You don&apos;t manage any projects yet.</p>
            ) : (
              <DonutChart data={projectDonutData} centerLabel="Projects" />
            )}
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Upcoming deadlines" description="Your tasks due in the next two weeks." />
            {data.upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-charcoal-muted">Nothing due in the next two weeks.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingDeadlines.map((task) =>
                  canManageProjects ? (
                    <li key={task.id} className="text-sm">
                      <Link
                        href={`/admin/projects/${task.project.id}`}
                        className="font-medium text-charcoal-dark hover:text-crimson"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-charcoal-muted">
                        {task.project.title} · Due {formatDate(task.dueDate)}
                      </p>
                    </li>
                  ) : (
                    <li key={task.id} className="text-sm">
                      <p className="font-medium text-charcoal-dark">{task.title}</p>
                      <p className="text-xs text-charcoal-muted">
                        {task.project.title} · Due {formatDate(task.dueDate)}
                      </p>
                    </li>
                  )
                )}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Notifications" />
            {data.recentNotifications.length === 0 ? (
              <p className="text-sm text-charcoal-muted">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.recentNotifications.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-charcoal-dark">{n.title}</p>
                      <p className="text-xs text-charcoal-muted">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <NotificationMarkReadButton notificationId={n.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Container>
    </main>
  );
}
