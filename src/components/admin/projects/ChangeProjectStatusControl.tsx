"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changeProjectStatusAction } from "@/lib/actions/admin-projects";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { ProjectStatus } from "@prisma/client";

const STATUS_OPTIONS: ProjectStatus[] = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

export function ChangeProjectStatusControl({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: ProjectStatus;
}) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(changeProjectStatusAction);
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(projectId, { status });
    if (result?.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ProjectStatus)}
        className="glass-input w-full rounded-lg px-3 py-2 text-sm"
        aria-label="Project status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
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
