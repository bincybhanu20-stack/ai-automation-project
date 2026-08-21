"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/lib/actions/admin-tasks";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const;
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface CreateTaskFormProps {
  projects: { id: string; title: string }[];
  assignees: { id: string; name: string; role: string }[];
  defaultProjectId?: string;
}

export function CreateTaskForm({ projects, assignees, defaultProjectId }: CreateTaskFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(createTaskAction);
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: defaultProjectId ?? projects[0]?.id ?? "",
    assigneeId: "",
    status: "TODO" as (typeof STATUS_OPTIONS)[number],
    priority: "MEDIUM" as (typeof PRIORITY_OPTIONS)[number],
    dueDate: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(form);
    if (result?.success && result.taskId) {
      router.push(`/admin/tasks/${result.taskId}`);
    }
  }

  if (projects.length === 0) {
    return (
      <Alert variant="error">
        No projects exist yet. Create a project first, then come back to add a task for it.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white space-y-5 p-6 shadow-sm sm:p-8" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField
          id="title"
          label="Task title"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Design homepage wireframe"
        />
        {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
      </div>

      <TextareaField
        id="description"
        label="Description (optional)"
        rows={3}
        value={form.description}
        onChange={(e) => update("description", e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="projectId" className="mb-1.5 block text-sm font-medium text-charcoal">
            Project
          </label>
          <select
            id="projectId"
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
          <label htmlFor="assigneeId" className="mb-1.5 block text-sm font-medium text-charcoal">
            Assignee (optional)
          </label>
          <select
            id="assigneeId"
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
          id="status"
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) => update("status", e.target.value as (typeof STATUS_OPTIONS)[number])}
        />
        <SelectField
          id="priority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.priority}
          onChange={(e) => update("priority", e.target.value as (typeof PRIORITY_OPTIONS)[number])}
        />
        <FormField
          id="dueDate"
          label="Due date (optional)"
          type="date"
          value={form.dueDate}
          onChange={(e) => update("dueDate", e.target.value)}
        />
      </div>

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Create task
      </Button>
    </form>
  );
}
