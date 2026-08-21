"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectFromLeadAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/ui/FormField";
import { TextareaField } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface CreateProjectFormProps {
  leadId: string;
  defaultTitle: string;
  staff: { id: string; name: string }[];
}

export function CreateProjectForm({ leadId, defaultTitle, staff }: CreateProjectFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(createProjectFromLeadAction);
  const [form, setForm] = useState({
    title: defaultTitle,
    description: "",
    budget: "",
    deadline: "",
    managerId: "",
  });
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(leadId, form);
    if (result?.success) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) return <Alert variant="success">Project created.</Alert>;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      <FormField
        id="projectTitle"
        label="Project title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      {fieldErrors.title && <p className="-mt-2 text-xs text-red-400">{fieldErrors.title}</p>}

      <TextareaField
        id="projectDescription"
        label="Description (optional)"
        rows={3}
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="projectBudget"
          label="Budget (optional)"
          type="number"
          min={0}
          value={form.budget}
          onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
        />
        <FormField
          id="projectDeadline"
          label="Deadline (optional)"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="projectManager" className="mb-1.5 block text-sm font-medium text-slate-300">
          Project manager (optional)
        </label>
        <select
          id="projectManager"
          value={form.managerId}
          onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
          className="glass-input w-full rounded-lg px-3.5 py-2.5 text-sm"
        >
          <option value="">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" isLoading={isPending} size="sm" className="w-full">
        Create project
      </Button>
    </form>
  );
}
