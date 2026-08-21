"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/lib/actions/admin-users";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { FormField } from "@/components/admin/ui/FormField";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const ROLE_OPTIONS = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"] as const;

export function CreateUserForm() {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(createUserAction);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "TEAM_MEMBER" as (typeof ROLE_OPTIONS)[number],
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(form);
    if (result?.success && result.userId) {
      router.push(`/admin/users/${result.userId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-hairline bg-white space-y-5 p-6 shadow-sm sm:p-8" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <FormField
          id="name"
          label="Full name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jordan Blake"
        />
        {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
      </div>

      <div>
        <FormField
          id="email"
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="jordan@example.com"
        />
        {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
      </div>

      <div>
        <FormField
          id="password"
          label="Temporary password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          placeholder="At least 8 characters"
        />
        {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
        <p className="mt-1 text-xs text-charcoal-muted">Share this with the user directly — it isn&apos;t emailed automatically.</p>
      </div>

      <SelectField
        id="role"
        label="Role"
        options={ROLE_OPTIONS}
        value={form.role}
        onChange={(e) => update("role", e.target.value as (typeof ROLE_OPTIONS)[number])}
      />

      <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
        Create user
      </Button>
    </form>
  );
}
