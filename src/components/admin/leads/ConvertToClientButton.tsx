"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { convertLeadToClientAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

export function ConvertToClientButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(convertLeadToClientAction);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    const result = await run(leadId);
    if (result?.success) router.refresh();
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-xs text-charcoal">
          This creates a new client record and marks the lead as WON. This can&apos;t be undone.
          Are you sure?
        </p>
        <div className="flex gap-2">
          <Button onClick={handleConfirm} isLoading={isPending} size="sm" className="flex-1">
            Yes, convert
          </Button>
          <Button onClick={() => setConfirming(false)} variant="secondary" size="sm" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={() => setConfirming(true)} variant="secondary" size="sm" className="w-full">
      <UserCheck className="h-4 w-4" aria-hidden="true" />
      Convert to client
    </Button>
  );
}
