"use client";

import { useRouter } from "next/navigation";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/admin-notifications";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      isLoading={isPending}
      onClick={() =>
        startTransition(async () => {
          await markNotificationReadAction(notificationId);
          router.refresh();
        })
      }
    >
      Mark read
    </Button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      isLoading={isPending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      Mark all read
    </Button>
  );
}
