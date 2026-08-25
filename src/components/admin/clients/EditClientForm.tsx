"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateClientAction } from "@/lib/actions/admin-clients";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

interface EditClientFormProps {
  clientId: string;
  initial: {
    companyName: string;
    industry: string;
    phone: string;
    email: string;
    address: string;
    status: string;
  };
}

export function EditClientForm({ clientId, initial }: EditClientFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(updateClientAction);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(clientId, form);
    if (result?.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit client details
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline p-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField
          id="editCompanyName"
          label="Company name"
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value)}
        />
        {fieldErrors.companyName && <p className="mt-1 text-xs text-red-600">{fieldErrors.companyName}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="editIndustry" label="Industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
        <SelectField
          id="editStatus"
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        />
        <div>
          <FormField id="editPhone" label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          {fieldErrors.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>}
        </div>
        <div>
          <FormField id="editEmail" label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>
      </div>

      <FormField id="editAddress" label="Address" value={form.address} onChange={(e) => update("address", e.target.value)} />

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
