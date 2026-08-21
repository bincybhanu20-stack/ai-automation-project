import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getUserById } from "@/lib/services/admin/users";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import { EditUserForm } from "@/components/admin/users/EditUserForm";
import { DeactivateUserButton } from "@/components/admin/users/DeactivateUserButton";

// Same cached-guard-plus-404 pattern as every other admin detail page.
const getUserOr404 = cache(async (id: string) => {
  await requireAdmin();
  const user = await getUserById(id);
  if (!user) notFound();
  return user;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const user = await getUserOr404(params.id);
  return { title: user.name };
}

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const [session, user] = await Promise.all([requireAdmin(), getUserOr404(params.id)]);
  const isSelf = session.userId === user.id;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to users
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">{user.name}</h1>
          <p className="mt-1 text-sm text-charcoal-muted">{user.email}</p>
        </div>
        <StatusBadge value={user.status} />
      </div>

      <Card className="space-y-5">
        <CardHeader title="Details" />

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Role" value={user.role.replace(/_/g, " ")} />
          <Field label="Created" value={formatDate(user.createdAt)} />
          <Field label="Assigned tasks" value={String(user.assignedTaskCount)} />
          <Field label="Managed projects" value={String(user.managedProjectCount)} />
        </dl>

        {isSelf && (
          <p className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs text-charcoal-muted">
            This is your own account — you can&apos;t change your own role or deactivate yourself.
          </p>
        )}

        <div className="flex flex-wrap gap-2 border-t border-hairline pt-4">
          <EditUserForm
            userId={user.id}
            isSelf={isSelf}
            initial={{ name: user.name, email: user.email, role: user.role }}
          />
          <DeactivateUserButton
            userId={user.id}
            userName={user.name}
            status={user.status}
            isSelf={isSelf}
            assignedTaskCount={user.assignedTaskCount}
            managedProjectCount={user.managedProjectCount}
          />
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-charcoal-muted">{label}</dt>
      <dd className="mt-1 text-charcoal-dark">{value}</dd>
    </div>
  );
}
