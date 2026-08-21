"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markManagerNotificationReadAction } from "@/lib/actions/manager";
import { Button } from "@/components/admin/ui/Button";

export function NotificationMarkReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      isLoading={isPending}
      onClick={() =>
        startTransition(async () => {
          await markManagerNotificationReadAction(notificationId);
          router.refresh();
        })
      }
    >
      Mark read
    </Button>
  );
}
