"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateProjectAction } from "@/lib/actions/admin-projects";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface EditProjectFormProps {
  projectId: string;
  hasTasks: boolean;
  initial: {
    title: string;
    description: string;
    priority: string;
    budget: string;
    progress: string;
    startDate: string;
    deadline: string;
  };
}

export function EditProjectForm({ projectId, hasTasks, initial }: EditProjectFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(updateProjectAction);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(projectId, form);
    if (result?.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit project details
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline p-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField id="editTitle" label="Title" value={form.title} onChange={(e) => update("title", e.target.value)} />
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
        <SelectField
          id="editPriority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.priority}
          onChange={(e) => update("priority", e.target.value)}
        />
        <FormField
          id="editBudget"
          label="Budget"
          type="number"
          min={0}
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
        />
        <FormField
          id="editStartDate"
          label="Start date"
          type="date"
          value={form.startDate}
          onChange={(e) => update("startDate", e.target.value)}
        />
        <FormField
          id="editDeadline"
          label="Due date"
          type="date"
          value={form.deadline}
          onChange={(e) => update("deadline", e.target.value)}
        />
      </div>

      <div>
        <FormField
          id="editProgress"
          label="Progress (%)"
          type="number"
          min={0}
          max={100}
          value={form.progress}
          onChange={(e) => update("progress", e.target.value)}
          disabled={hasTasks}
        />
        {fieldErrors.progress && <p className="mt-1 text-xs text-red-600">{fieldErrors.progress}</p>}
        {hasTasks && (
          <p className="mt-1 text-xs text-charcoal-muted">
            This project has tasks, so progress is calculated automatically from how many are completed.
          </p>
        )}
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
