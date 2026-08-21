"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck } from "lucide-react";
import { deactivateUserAction, reactivateUserAction } from "@/lib/actions/admin-users";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

interface DeactivateUserButtonProps {
  userId: string;
  userName: string;
  status: "ACTIVE" | "SUSPENDED";
  isSelf: boolean;
  /** Real counts, shown in the confirmation so an admin can see what's
   * attached to this account before deactivating it — per "check whether
   * the user is assigned to tasks or projects" before deleting. */
  assignedTaskCount: number;
  managedProjectCount: number;
}

/**
 * "Delete" a user = deactivate (see deactivateUser() in
 * lib/services/admin/users.ts for why this uses the existing
 * status/SUSPENDED mechanism instead of a hard database delete). A
 * suspended account can be reactivated the same way — this one control
 * handles both directions.
 */
export function DeactivateUserButton({
  userId,
  userName,
  status,
  isSelf,
  assignedTaskCount,
  managedProjectCount,
}: DeactivateUserButtonProps) {
  const router = useRouter();
  const deactivate = useServerAction(deactivateUserAction);
  const reactivate = useServerAction(reactivateUserAction);
  const [confirming, setConfirming] = useState(false);

  if (status === "SUSPENDED") {
    return (
      <Button
        onClick={async () => {
          const result = await reactivate.run(userId);
          if (result?.success) router.refresh();
        }}
        isLoading={reactivate.isPending}
        variant="secondary"
        size="sm"
      >
        <UserCheck className="h-4 w-4" aria-hidden="true" />
        Reactivate
      </Button>
    );
  }

  if (isSelf) {
    return null; // self-deactivation is blocked server-side too — no point showing a button that will always fail
  }

  if (confirming) {
    const hasAssignments = assignedTaskCount > 0 || managedProjectCount > 0;
    return (
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        {deactivate.error && <Alert variant="error">{deactivate.error}</Alert>}
        <p className="text-xs text-charcoal">
          Deactivate <span className="font-medium text-charcoal-dark">{userName}</span>? They&apos;ll
          immediately lose the ability to log in.
          {hasAssignments && (
            <>
              {" "}
              They currently have {assignedTaskCount} assigned task{assignedTaskCount === 1 ? "" : "s"} and{" "}
              {managedProjectCount} managed project{managedProjectCount === 1 ? "" : "s"} — those stay
              assigned to them and aren&apos;t affected.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              const result = await deactivate.run(userId);
              if (result?.success) router.refresh();
              setConfirming(false);
            }}
            isLoading={deactivate.isPending}
            size="sm"
            variant="danger"
            className="flex-1"
          >
            Yes, deactivate
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
      <UserX className="h-4 w-4" aria-hidden="true" />
      Deactivate
    </Button>
  );
}
