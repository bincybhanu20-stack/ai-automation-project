import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getNotificationsForUser } from "@/lib/services/notifications";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, cn } from "@/lib/utils";
import { MarkReadButton, MarkAllReadButton } from "@/components/admin/notifications/NotificationActions";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Notifications" };
}

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await requireAdmin();
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { notifications, total, unreadCount, totalPages } = await getNotificationsForUser(session.userId, page);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notifications</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} total · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={cn("flex items-start justify-between gap-4", !n.isRead && "border-sky-500/30")}>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <StatusBadge value={n.type} />
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" aria-label="Unread" />}
                  </div>
                  <p className="text-sm font-medium text-slate-100">{n.title}</p>
                  <p className="text-sm text-slate-400">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatDate(n.createdAt)}</p>
                </div>
                {!n.isRead && <MarkReadButton notificationId={n.id} />}
              </Card>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={(p) => `/admin/notifications?page=${p}`} />
        </>
      )}
    </div>
  );
}
