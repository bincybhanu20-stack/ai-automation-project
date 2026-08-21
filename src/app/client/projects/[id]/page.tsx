import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { requireProjectAccessForPage } from "@/lib/page-guards";
import { getClientProjectExtras } from "@/lib/services/client/projects";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectMessageForm } from "@/components/client/ProjectMessageForm";
import { formatDate, cn } from "@/lib/utils";

// requireProjectAccessForPage (src/lib/page-guards.ts) already does exactly
// what this route needs: ADMIN/staff always allowed, CLIENT only if this
// project belongs to THEIR OWN client record — verified server-side against
// the database, never against anything the URL claims. A client hitting
// another client's project id gets a real 404 (see that file's comment for
// why generateMetadata is what makes the status code correct).
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { project } = await requireProjectAccessForPage(params.id);
  return { title: project.title };
}

export const dynamic = "force-dynamic";

export default async function ClientProjectDetailPage({ params }: { params: { id: string } }) {
  const { project } = await requireProjectAccessForPage(params.id);
  const { milestones, taskSummary, messages, recentUpdates } = await getClientProjectExtras(project.id);

  return (
    <div className="space-y-6">
      <Link href="/client" className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{project.title}</h1>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-400">{project.description}</p>}
        </div>
        <StatusBadge value={project.status} />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-400">Progress</span>
          <span className="text-sm font-medium text-slate-200">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Start date</dt>
            <dd className="mt-1 text-slate-200">{formatDate(project.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Due date</dt>
            <dd className="mt-1 text-slate-200">{formatDate(project.deadline)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <Card>
          <CardHeader title="Milestones" />
          {milestones.length === 0 ? (
            <EmptyState title="No milestones yet" description="Key checkpoints for this project will appear here." />
          ) : (
            <ul className="space-y-3">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-3">
                  {m.completedAt ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                  )}
                  <div>
                    <p className={cn("text-sm", m.completedAt ? "text-slate-400 line-through" : "text-slate-200")}>
                      {m.title}
                    </p>
                    {m.dueDate && <p className="text-xs text-slate-500">Due {formatDate(m.dueDate)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Task summary */}
        <Card>
          <CardHeader title="Task summary" />
          {taskSummary.total === 0 ? (
            <EmptyState title="No tasks yet" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <TaskStat label="To do" value={taskSummary.todo} />
              <TaskStat label="In progress" value={taskSummary.inProgress} />
              <TaskStat label="In review" value={taskSummary.review} />
              <TaskStat label="Completed" value={taskSummary.completed} />
            </div>
          )}
        </Card>
      </div>

      {/* Recent updates */}
      <Card>
        <CardHeader title="Recent updates" />
        {recentUpdates.length === 0 ? (
          <EmptyState title="No recent updates" />
        ) : (
          <ul className="space-y-3">
            {recentUpdates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 text-sm">
                <p className="text-slate-300">
                  <span className="text-slate-100">{t.title}</span> is now <StatusBadge value={t.status} />
                </p>
                <span className="shrink-0 text-xs text-slate-600">{formatDate(t.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Messages / requests */}
      <Card>
        <CardHeader title="Messages" description="Send a message or request about this project." />
        <div className="mb-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-500">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-white/[0.03] p-3">
                <p className="whitespace-pre-wrap text-sm text-slate-300">{m.body}</p>
                <p className="mt-1.5 text-xs text-slate-500">
                  {m.author?.name ?? "Unknown"}
                  {m.author && m.author.role !== "CLIENT" && " · Team"} · {formatDate(m.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
        <ProjectMessageForm projectId={project.id} />
      </Card>
    </div>
  );
}

function TaskStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
