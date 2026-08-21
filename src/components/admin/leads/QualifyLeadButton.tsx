"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { qualifyLeadAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function QualifyLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(qualifyLeadAction);

  async function handleClick() {
    const result = await run(leadId);
    if (result?.success) router.refresh();
  }

  return (
    <div className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <Button onClick={handleClick} isLoading={isPending} variant="secondary" size="sm" className="w-full">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Run AI qualification
      </Button>
    </div>
  );
}
