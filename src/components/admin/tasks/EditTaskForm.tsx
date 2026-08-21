"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateTaskAction } from "@/lib/actions/admin-tasks";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface EditTaskFormProps {
  taskId: string;
  projects: { id: string; title: string }[];
  assignees: { id: string; name: string; role: string }[];
  initial: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    status: (typeof STATUS_OPTIONS)[number];
    priority: (typeof PRIORITY_OPTIONS)[number];
    dueDate: string;
  };
}

/** Loads the task's current values into an editable form — mirrors
 * EditProjectForm.tsx's toggle-to-edit pattern, extended to cover every
 * field this task has (title, description, project, assignee, status,
 * priority, due date), since Task — unlike Project — doesn't split those
 * out into separate assign/status controls. */
export function EditTaskForm({ taskId, projects, assignees, initial }: EditTaskFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(updateTaskAction);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(taskId, form);
    if (result?.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit task
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline p-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField id="editTitle" label="Task title" value={form.title} onChange={(e) => update("title", e.target.value)} />
        {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
      </div>

      <TextareaField
        id="editDescription"
        label="Description"
        rows={3}
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="editProjectId" className="mb-1.5 block text-sm font-medium text-charcoal">
            Project
          </label>
          <select
            id="editProjectId"
            value={form.projectId}
            onChange={(e) => update("projectId", e.target.value)}
            className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3.5 py-2.5 text-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {fieldErrors.projectId && <p className="mt-1 text-xs text-red-600">{fieldErrors.projectId}</p>}
        </div>

        <div>
          <label htmlFor="editAssigneeId" className="mb-1.5 block text-sm font-medium text-charcoal">
            Assignee
          </label>
          <select
            id="editAssigneeId"
            value={form.assigneeId}
            onChange={(e) => update("assigneeId", e.target.value)}
            className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3.5 py-2.5 text-sm"
          >
            <option value="">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role.replace("_", " ")})
              </option>
            ))}
          </select>
        </div>

        <SelectField
          id="editStatus"
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) => update("status", e.target.value as (typeof STATUS_OPTIONS)[number])}
        />
        <SelectField
          id="editPriority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.priority}
          onChange={(e) => update("priority", e.target.value as (typeof PRIORITY_OPTIONS)[number])}
        />
        <FormField
          id="editDueDate"
          label="Due date"
          type="date"
          value={form.dueDate}
          onChange={(e) => update("dueDate", e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending} size="sm">
          Save changes
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
