"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteTaskAction } from "@/lib/actions/admin-tasks";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

interface DeleteTaskButtonProps {
  taskId: string;
  taskTitle: string;
  /** Detail page passes this so a successful delete navigates away from a
   * now-gone task instead of leaving the user on a 404. The list page's
   * row-level button omits it and just refreshes in place. */
  redirectTo?: string;
}

/** Inline two-step confirm — same pattern as ConvertToClientButton.tsx —
 * rather than a separate modal component, since that's the established
 * destructive-action pattern in this admin panel already. */
export function DeleteTaskButton({ taskId, taskTitle, redirectTo }: DeleteTaskButtonProps) {
  const router = useRouter();
  const { run, isPending, error } = useServerAction(deleteTaskAction);
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    const result = await run(taskId);
    if (result?.success) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    }
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-xs text-charcoal">
          Delete <span className="font-medium text-charcoal-dark">&ldquo;{taskTitle}&rdquo;</span>? This
          can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleConfirm} isLoading={isPending} size="sm" variant="danger" className="flex-1">
            Yes, delete
          </Button>
          <Button onClick={() => setConfirming(false)} variant="secondary" size="sm" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={() => setConfirming(true)} variant="secondary" size="sm">
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      Delete
    </Button>
  );
}
