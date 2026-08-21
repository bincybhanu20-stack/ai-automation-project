import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, CheckSquare, CalendarClock, Bell } from "lucide-react";
import { requireClient } from "@/lib/client-guard";
import { getClientDashboardData } from "@/lib/services/client/dashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { NotificationMarkReadButton } from "@/components/client/NotificationMarkReadButton";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireClient();
  return { title: "Dashboard" };
}

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const session = await requireClient();
  const data = await getClientDashboardData(session.userId);

  if (!data.client) {
    // Genuine error state, not a crash: this account has no linked client
    // company record yet. Distinct from "no projects" (an empty state) —
    // this account can't have projects at all until IT support links one.
    return (
      <Card>
        <p className="text-sm text-slate-400">
          No client profile is linked to your account yet. Contact your account
          manager to get set up.
        </p>
      </Card>
    );
  }

  const { client, activeProjects, openTasksCount, upcomingDeadlines, recentActivity, recentNotifications } = data;
  const unreadCount = recentNotifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Welcome back, {session.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {client.companyName}
          {client.industry && ` · ${client.industry}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active projects" value={activeProjects.length} icon={FolderKanban} />
        <StatCard label="Open tasks" value={openTasksCount} icon={CheckSquare} />
        <StatCard label="Upcoming deadlines" value={upcomingDeadlines.length} icon={CalendarClock} />
        <StatCard label="Unread notifications" value={unreadCount} icon={Bell} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects + progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Your projects" description="Active and recent." />
            {client.projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Projects will appear here once your team creates one for you."
              />
            ) : (
              <div className="space-y-4">
                {client.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/client/projects/${project.id}`}
                    className="block rounded-lg border border-white/5 p-4 hover:border-white/10 hover:bg-white/[0.02]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">{project.title}</p>
                      <StatusBadge value={project.status} />
                    </div>
                    <ProgressBar value={project.progress} />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{project.progress}% complete</span>
                      <span>{project._count.tasks} task{project._count.tasks === 1 ? "" : "s"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: deadlines + notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Upcoming deadlines" />
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing due in the next two weeks.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingDeadlines.map((d) => (
                  <li key={`${d.kind}-${d.id}`} className="text-sm">
                    <Link href={`/client/projects/${d.projectId}`} className="text-slate-200 hover:text-sky-400">
                      {d.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {d.kind === "project" ? "Project deadline" : `Task · ${d.projectTitle}`} ·{" "}
                      {formatDate(d.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Notifications" />
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <NotificationMarkReadButton notificationId={n.id} />}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader title="Recent activity" />
        {recentActivity.length === 0 ? (
          <EmptyState title="No recent activity" description="Updates to your projects and tasks will show up here." />
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-4 text-sm">
                <div>
                  {item.kind === "task" && (
                    <p className="text-slate-300">
                      Task <span className="text-slate-100">{item.title}</span> in{" "}
                      <Link href={`/client/projects/${item.projectId}`} className="text-sky-400 hover:text-sky-300">
                        {item.projectTitle}
                      </Link>{" "}
                      is now <StatusBadge value={item.status} />
                    </p>
                  )}
                  {item.kind === "project" && (
                    <p className="text-slate-300">
                      Project{" "}
                      <Link href={`/client/projects/${item.id}`} className="text-sky-400 hover:text-sky-300">
                        {item.title}
                      </Link>{" "}
                      is now <StatusBadge value={item.status} />
                    </p>
                  )}
                  {item.kind === "notification" && <p className="text-slate-300">{item.title}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-600">{formatDate(item.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
