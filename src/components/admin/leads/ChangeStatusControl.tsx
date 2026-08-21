"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeLeadStatusAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { LeadStatus } from "@prisma/client";

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

export function ChangeStatusControl({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(changeLeadStatusAction);
  const [status, setStatus] = useState<LeadStatus>(currentStatus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(leadId, { status });
    if (result?.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as LeadStatus)}
        className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        aria-label="Lead status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        isLoading={isPending}
        disabled={status === currentStatus}
        className="w-full"
      >
        Update status
      </Button>
    </form>
  );
}
