"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "@/lib/actions/admin-projects";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const STATUS_OPTIONS = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

interface CreateProjectFormProps {
  clients: { id: string; companyName: string }[];
  managerCandidates: { id: string; name: string; role: string }[];
  /** Only ADMIN gets to pick a manager up front — a PROJECT_MANAGER creating
   * a project always becomes its manager (see createProject() in
   * src/lib/services/admin/projects.ts for why). */
  showManagerPicker: boolean;
}

export function CreateProjectForm({ clients, managerCandidates, showManagerPicker }: CreateProjectFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(createProjectAction);
  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: clients[0]?.id ?? "",
    managerId: "",
    status: "PLANNING" as (typeof STATUS_OPTIONS)[number],
    priority: "MEDIUM" as (typeof PRIORITY_OPTIONS)[number],
    budget: "",
    startDate: "",
    deadline: "",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(form);
    if (result?.success && result.projectId) {
      router.push(`/admin/projects/${result.projectId}`);
    }
  }

  if (clients.length === 0) {
    return (
      <Alert variant="error">
        No active clients exist yet. Convert a lead to a client first, then come back
        to create a project for them.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white space-y-5 p-6 shadow-sm sm:p-8" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField
          id="title"
          label="Project title"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="Website Revamp"
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
          <label htmlFor="clientId" className="mb-1.5 block text-sm font-medium text-charcoal">
            Client
          </label>
          <select
            id="clientId"
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
            className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3.5 py-2.5 text-sm"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          {fieldErrors.clientId && <p className="mt-1 text-xs text-red-600">{fieldErrors.clientId}</p>}
        </div>

        {showManagerPicker && (
          <div>
            <label htmlFor="managerId" className="mb-1.5 block text-sm font-medium text-charcoal">
              Project manager (optional)
            </label>
            <select
              id="managerId"
              value={form.managerId}
              onChange={(e) => update("managerId", e.target.value)}
              className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3.5 py-2.5 text-sm"
            >
              <option value="">Unassigned</option>
              {managerCandidates.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        )}

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
          id="budget"
          label="Budget (optional)"
          type="number"
          min={0}
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
        />
        <FormField
          id="startDate"
          label="Start date (optional)"
          type="date"
          value={form.startDate}
          onChange={(e) => update("startDate", e.target.value)}
        />
        <FormField
          id="deadline"
          label="Due date (optional)"
          type="date"
          value={form.deadline}
          onChange={(e) => update("deadline", e.target.value)}
        />
      </div>

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Create project
      </Button>
    </form>
  );
}
