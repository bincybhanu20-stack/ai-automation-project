"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignProjectManagerAction } from "@/lib/actions/admin-projects";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

interface AssignManagerControlProps {
  projectId: string;
  currentManagerId: string | null;
  candidates: { id: string; name: string; role: string }[];
}

export function AssignManagerControl({ projectId, currentManagerId, candidates }: AssignManagerControlProps) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(assignProjectManagerAction);
  const [managerId, setManagerId] = useState(currentManagerId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(projectId, { managerId });
    if (result?.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <select
        value={managerId}
        onChange={(e) => setManagerId(e.target.value)}
        className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3 py-2 text-sm"
        aria-label="Assign project manager"
      >
        <option value="">Unassigned</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.role.replace("_", " ")})
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="secondary" isLoading={isPending} className="w-full">
        Save manager
      </Button>
    </form>
  );
}
