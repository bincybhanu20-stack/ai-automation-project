"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateLeadAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/ui/FormField";
import { TextareaField } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface EditLeadFormProps {
  leadId: string;
  initial: {
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    budgetRange: string;
    message: string;
  };
}

export function EditLeadForm({ leadId, initial }: EditLeadFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(updateLeadAction);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(leadId, form);
    if (result?.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit lead details
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 p-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FormField id="editName" label="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          {fieldErrors.name && <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>}
        </div>
        <div>
          <FormField
            id="editEmail"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>}
        </div>
        <FormField id="editPhone" label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        <FormField
          id="editCompany"
          label="Company"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />
        <FormField
          id="editService"
          label="Service"
          value={form.service}
          onChange={(e) => update("service", e.target.value)}
        />
        <FormField
          id="editBudget"
          label="Budget range"
          value={form.budgetRange}
          onChange={(e) => update("budgetRange", e.target.value)}
        />
      </div>

      <div>
        <TextareaField
          id="editMessage"
          label="Project description"
          rows={4}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
        />
        {fieldErrors.message && <p className="mt-1 text-xs text-red-400">{fieldErrors.message}</p>}
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
