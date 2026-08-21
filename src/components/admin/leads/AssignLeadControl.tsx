"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignLeadAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface AssignLeadControlProps {
  leadId: string;
  currentAssigneeId: string | null;
  staff: { id: string; name: string; role: string }[];
}

export function AssignLeadControl({ leadId, currentAssigneeId, staff }: AssignLeadControlProps) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(assignLeadAction);
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(leadId, { assigneeId });
    if (result?.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        aria-label="Assign to"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.role.replace("_", " ")})
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="secondary" isLoading={isPending} className="w-full">
        Save assignment
      </Button>
    </form>
  );
}
