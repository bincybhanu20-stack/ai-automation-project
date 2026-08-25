import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireProjectStaff } from "@/lib/admin-guard";
import { canManageProject } from "@/lib/authorization";
import { getProjectById, getProjectManagerCandidates } from "@/lib/services/admin/projects";
import { getClientOptions } from "@/lib/services/admin/clients";
import { aiProjectSummarySchema } from "@/lib/validations/n8n";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { ProgressBar } from "@/components/admin/ui/ProgressBar";
import { formatDate } from "@/lib/utils";
import { EditProjectForm } from "@/components/admin/projects/EditProjectForm";
import { GenerateSummaryButton } from "@/components/admin/projects/GenerateSummaryButton";
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

  // project.aiSummary is a Prisma Json field — never trust its shape blindly.
  // Reusing the same Zod schema the write-back endpoint validates against
  // (src/lib/validations/n8n.ts) means "what the API accepted" and "what
  // this page will render" can never drift apart. A parse failure (e.g.
  // malformed historical data) falls back to the empty state below rather
  // than crashing the page.
  const parsedAiSummary = project.aiSummary
    ? aiProjectSummarySchema.safeParse(project.aiSummary)
    : null;
  const aiSummary = parsedAiSummary?.success ? parsedAiSummary.data : null;

  return (
    <div>
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">{project.title}</h1>
          <p className="mt-1 text-sm text-charcoal-muted">
            {project.client.companyName}
            {project.originatingLead && (
              <>
                {" "}
                · from lead{" "}
                <Link href={`/admin/leads/${project.originatingLead.id}`} className="text-crimson hover:text-crimson-hover">
                  {project.originatingLead.name}
                </Link>
              </>
            )}
          </p>
        </div>
        <StatusBadge value={project.status} />
      </div>

      {!canEdit && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          View only — only this project&apos;s manager or an admin can edit it.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column: overview, tasks, activity */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Overview" />
            {project.description && <p className="mb-4 text-sm text-charcoal">{project.description}</p>}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-charcoal-muted">Progress</span>
              <span className="text-sm font-medium text-charcoal-dark">{project.computedProgress}%</span>
            </div>
            <ProgressBar value={project.computedProgress} />
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Priority" value={<StatusBadge value={project.priority} />} />
              <Field label="Budget" value={`$${project.budget.toLocaleString()}`} />
              <Field label="Start date" value={formatDate(project.startDate)} />
              <Field label="Due date" value={formatDate(project.deadline)} />
            </dl>
            {canEdit && (
              <div className="mt-4 border-t border-hairline pt-4">
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
              title="AI Project Summary"
              description={
                aiSummary ? `Last generated: ${formatDateTime(project.aiSummaryGeneratedAt)}` : undefined
              }
            />
            {canEdit && (
              <div className="mb-4">
                <GenerateSummaryButton
                  projectId={project.id}
                  hasSummary={Boolean(aiSummary)}
                  initialGeneratedAt={project.aiSummaryGeneratedAt ? project.aiSummaryGeneratedAt.toISOString() : null}
                />
              </div>
            )}
            {!aiSummary ? (
              <p className="text-sm text-charcoal-muted">No AI summary has been generated yet.</p>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-charcoal">{aiSummary.project_summary}</p>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Deliberately NOT the Project StatusBadge — this is the AI's own
                      restated status from aiSummary.status, a free-text field never
                      validated against the ProjectStatus enum and never written back
                      to Project.status. A visually distinct pill keeps it from being
                      mistaken for the real status shown in the sidebar. */}
                  <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    AI status: {aiSummary.status}
                  </span>
                  <span className="text-xs text-charcoal-muted">
                    {aiSummary.progress.completion_percentage}% complete
                  </span>
                </div>
                <ProgressBar value={aiSummary.progress.completion_percentage} />

                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
                  <Field label="Total" value={aiSummary.progress.total_tasks} />
                  <Field label="Completed" value={aiSummary.progress.completed_tasks} />
                  <Field label="In Progress" value={aiSummary.progress.in_progress_tasks} />
                  <Field label="Pending" value={aiSummary.progress.pending_tasks} />
                  <Field label="Overdue" value={aiSummary.progress.overdue_tasks} />
                </dl>

                <AiSummaryList title="Key Updates" items={aiSummary.key_updates} />
                <AiSummaryList title="Risks" items={aiSummary.risks} />
                <AiSummaryList title="Upcoming Deadlines" items={aiSummary.upcoming_deadlines} />
                <AiSummaryList title="Recommended Actions" items={aiSummary.recommended_actions} />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Tasks"
              description={`${project.tasks.length} task${project.tasks.length === 1 ? "" : "s"}`}
            />
            {project.tasks.length === 0 ? (
              <p className="text-sm text-charcoal-muted">
                No tasks yet. Progress is tracked manually until tasks exist.
              </p>
            ) : (
              <ul className="space-y-2">
                {project.tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3 text-sm">
                    <div>
                      <p className="text-charcoal-dark">{task.title}</p>
                      <p className="text-xs text-charcoal-muted">
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
              <p className="text-sm text-charcoal-muted">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {project.activity.map((event) => (
                  <li key={event.id} className="flex items-center justify-between gap-4 text-sm">
                    <p className="text-charcoal">
                      <span className="text-charcoal-dark">{event.action.replace(/_/g, " ")}</span>
                      {event.user && <span className="text-charcoal-muted"> · {event.user.name}</span>}
                    </p>
                    <span className="shrink-0 text-xs text-charcoal-muted">{formatDate(event.createdAt)}</span>
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
            <p className="mb-3 text-sm text-charcoal-dark">{project.client.companyName}</p>
            {canEdit && (
              <AssignClientControl projectId={project.id} currentClientId={project.client.id} clients={clients} />
            )}
          </Card>

          <Card>
            <CardHeader title="Manager" />
            <p className="mb-3 text-sm text-charcoal-dark">
              {project.manager?.name ?? <span className="text-charcoal-muted">Unassigned</span>}
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
      <dt className="text-xs uppercase tracking-wider text-charcoal-muted">{label}</dt>
      <dd className="mt-1 text-charcoal-dark">{value}</dd>
    </div>
  );
}

/** One bulleted section of the AI summary card. An empty array, or the
 * model's own literal ["Not available"] (used when it has nothing grounded
 * to say — see the WF-010 system prompt), both render as the same plain
 * "Not available" line rather than an empty or single-bullet list. */
function AiSummaryList({ title, items }: { title: string; items: string[] }) {
  const isNotAvailable =
    items.length === 0 || (items.length === 1 && items[0].trim().toLowerCase() === "not available");

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal-muted">{title}</h4>
      {isNotAvailable ? (
        <p className="text-sm text-charcoal-muted">Not available</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-charcoal">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-charcoal-muted">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Same null/invalid-date handling as formatDate (src/lib/utils.ts), plus a
 * time component — kept local to this page rather than added to the shared
 * utility, since nowhere else currently needs date+time together. */
function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
