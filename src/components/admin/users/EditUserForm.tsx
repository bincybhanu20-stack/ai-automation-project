"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateUserAction } from "@/lib/actions/admin-users";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const ROLE_OPTIONS = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"] as const;

interface EditUserFormProps {
  userId: string;
  isSelf: boolean;
  initial: {
    name: string;
    email: string;
    role: (typeof ROLE_OPTIONS)[number];
  };
}

export function EditUserForm({ userId, isSelf, initial }: EditUserFormProps) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(updateUserAction);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  function update<K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(userId, form);
    if (result?.success) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} variant="secondary" size="sm">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Edit user
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-hairline p-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField id="editName" label="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <FormField
          id="editEmail"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <SelectField
          id="editRole"
          label="Role"
          options={ROLE_OPTIONS}
          value={form.role}
          onChange={(e) => update("role", e.target.value as (typeof ROLE_OPTIONS)[number])}
          disabled={isSelf}
        />
        {isSelf && (
          <p className="mt-1 text-xs text-charcoal-muted">You can&apos;t change your own role.</p>
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
