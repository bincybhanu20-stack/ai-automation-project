"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignProjectClientAction } from "@/lib/actions/admin-projects";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

interface AssignClientControlProps {
  projectId: string;
  currentClientId: string;
  clients: { id: string; companyName: string }[];
}

export function AssignClientControl({ projectId, currentClientId, clients }: AssignClientControlProps) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(assignProjectClientAction);
  const [clientId, setClientId] = useState(currentClientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(projectId, { clientId });
    if (result?.success) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3 py-2 text-sm"
        aria-label="Assign client"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.companyName}
          </option>
        ))}
      </select>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        isLoading={isPending}
        disabled={clientId === currentClientId}
        className="w-full"
      >
        Reassign client
      </Button>
    </form>
  );
}
