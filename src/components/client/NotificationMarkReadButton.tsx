"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markClientNotificationReadAction } from "@/lib/actions/client";
import { Button } from "@/components/ui/Button";

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
          await markClientNotificationReadAction(notificationId);
          router.refresh();
        })
      }
    >
      Mark read
    </Button>
  );
}
