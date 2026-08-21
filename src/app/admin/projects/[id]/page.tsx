import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireProjectStaff } from "@/lib/admin-guard";
import { canManageProject } from "@/lib/authorization";
import { getProjectById, getProjectManagerCandidates } from "@/lib/services/admin/projects";
import { getClientOptions } from "@/lib/services/admin/clients";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatDate } from "@/lib/utils";
import { EditProjectForm } from "@/components/admin/projects/EditProjectForm";
import { ChangeProjectStatusControl } from "@/components/admin/projects/ChangeProjectStatusControl";
import { AssignManagerControl } from "@/components/admin/projects/AssignManagerControl";
import { AssignClientControl } from "@/components/admin/projects/AssignClientControl";

// Auth + existence check, cached per request so generateMetadata and the
// page body share one Prisma round trip — same pattern as the lead detail
// page (src/app/admin/leads/[id]/page.tsx), for the same reason: calling
// notFound() from generateMetadata is what makes an unknown project id
// return a real HTTP 404 instead of 200-with-404-content. See
// src/lib/page-guards.ts's comment for the full story.
const getProjectOr404 = cache(async (id: string) => {
  // VIEWING is open to any ADMIN/PROJECT_MANAGER who can reach this route at
  // all (broad internal visibility, same principle as leads/clients lists).
  // EDITING is the narrower, per-project check — see canManageProject()
  // below, applied only to which controls render, not to page access.
  await requireProjectStaff();
  const project = await getProjectById(id);
  if (!project) notFound();
  return project;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const project = await getProjectOr404(params.id);
  return { title: project.title };
}

export const dynamic = "force-dynamic";

export default async function AdminProjectDetailPage({ params }: { params: { id: string } }) {
  const [session, project] = await Promise.all([requireProjectStaff(), getProjectOr404(params.id)]);

  const canEdit = canManageProject(session, project);
  const [managerCandidates, clients] = canEdit
    ? await Promise.all([getProjectManagerCandidates(), getClientOptions()])
    : [[], []];

  return (
    <div>
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{project.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {project.client.companyName}
            {project.originatingLead && (
              <>
                {" "}
                · from lead{" "}
                <Link href={`/admin/leads/${project.originatingLead.id}`} className="text-sky-400 hover:text-sky-300">
                  {project.originatingLead.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <StatusBadge value={project.status} />
      </div>

      {!canEdit && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          View only — only this project&apos;s manager or an admin can edit it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column: overview, tasks, activity */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Overview" />
            {project.description && <p className="mb-4 text-sm text-slate-300">{project.description}</p>}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">Progress</span>
              <span className="text-sm font-medium text-slate-200">{project.computedProgress}%</span>
            </div>
            <ProgressBar value={project.computedProgress} />
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Priority" value={<StatusBadge value={project.priority} />} />
              <Field label="Budget" value={`$${project.budget.toLocaleString()}`} />
              <Field label="Start date" value={formatDate(project.startDate)} />
              <Field label="Due date" value={formatDate(project.deadline)} />
            </dl>
            {canEdit && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <EditProjectForm
                  projectId={project.id}
                  hasTasks={project.tasks.length > 0}
                  initial={{
                    title: project.title,
                    description: project.description ?? "",
                    priority: project.priority,
                    budget: String(project.budget),
                    progress: String(project.progress),
                    startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : "",
                    deadline: project.deadline ? project.deadline.toISOString().slice(0, 10) : "",
                  }}
                />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Tasks"
              description={`${project.tasks.length} task${project.tasks.length === 1 ? "" : "s"}`}
            />
            {project.tasks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tasks yet. Progress is tracked manually until tasks exist.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.03] p-3 text-sm">
                    <div>
                      <p className="text-slate-200">{task.title}</p>
                      <p className="text-xs text-slate-500">
                        {task.assignee?.name ?? "Unassigned"}
                        {task.dueDate && ` · Due ${formatDate(task.dueDate)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge value={task.priority} />
                      <StatusBadge value={task.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Activity" description="Recorded changes to this project." />
            {project.activity.length === 0 ? (
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {project.activity.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-4 text-sm">
                    <p className="text-slate-300">
                      <span className="text-slate-100">{event.action.replace(/_/g, " ")}</span>
                      {event.user && <span className="text-slate-500"> · {event.user.name}</span>}
                    </p>
                    <span className="shrink-0 text-xs text-slate-600">{formatDate(event.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Sidebar: client, manager, status controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Client" />
            <p className="mb-3 text-sm text-slate-200">{project.client.companyName}</p>
            {canEdit && (
              <AssignClientControl projectId={project.id} currentClientId={project.client.id} clients={clients} />
            )}
          </Card>

          <Card>
            <CardHeader title="Manager" />
            <p className="mb-3 text-sm text-slate-200">
              {project.manager?.name ?? <span className="text-slate-500">Unassigned</span>}
            </p>
            {canEdit && (
              <AssignManagerControl
                projectId={project.id}
                currentManagerId={project.manager?.id ?? null}
                candidates={managerCandidates}
              />
            )}
          </Card>

          <Card>
            <CardHeader title="Status" />
            {canEdit ? (
              <ChangeProjectStatusControl projectId={project.id} currentStatus={project.status} />
            ) : (
              <StatusBadge value={project.status} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}
