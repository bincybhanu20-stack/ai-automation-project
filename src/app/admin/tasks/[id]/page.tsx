import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getTaskById, getProjectOptions } from "@/lib/services/admin/tasks";
import { getAssignableStaff } from "@/lib/services/admin/leads";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { EditTaskForm } from "@/components/admin/tasks/EditTaskForm";
import { DeleteTaskButton } from "@/components/admin/tasks/DeleteTaskButton";

// Same cached-guard-plus-404 pattern as every other admin detail page (see
// leads/[id] and projects/[id]) — calling notFound() from generateMetadata
// is what makes an unknown task id return a real HTTP 404.
const getTaskOr404 = cache(async (id: string) => {
  await requireAdmin();
  const task = await getTaskById(id);
  if (!task) notFound();
  return task;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const task = await getTaskOr404(params.id);
  return { title: task.title };
}

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const [task, projects, assignees] = await Promise.all([
    getTaskOr404(params.id),
    getProjectOptions(),
    getAssignableStaff(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">{task.title}</h1>
          <p className="mt-1 text-sm text-charcoal-muted">
            <Link href={`/admin/projects/${task.project.id}`} className="text-crimson hover:text-crimson-hover">
              {task.project.title}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={task.priority} />
          <StatusBadge value={task.status} />
        </div>
      </div>

      <Card className="space-y-5">
        <CardHeader title="Details" />

        {task.description && <p className="text-sm text-charcoal">{task.description}</p>}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Assignee" value={task.assignee?.name ?? "Unassigned"} />
          <Field label="Created by" value={task.creator?.name ?? "—"} />
          <Field label="Due date" value={task.dueDate ? formatDate(task.dueDate) : "—"} />
          <Field label="Completed" value={task.completedAt ? formatDate(task.completedAt) : "—"} />
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
          <EditTaskForm
            taskId={task.id}
            projects={projects}
            assignees={assignees}
            initial={{
              title: task.title,
              description: task.description ?? "",
              projectId: task.project.id,
              assigneeId: task.assignee?.id ?? "",
              status: task.status,
              priority: task.priority,
              dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "",
            }}
          />
          <DeleteTaskButton taskId={task.id} taskTitle={task.title} redirectTo="/admin/tasks" />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-charcoal-muted">{label}</dt>
      <dd className="mt-1 text-charcoal-dark">{value}</dd>
    </div>
  );
}
