import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getClientById } from "@/lib/services/admin/clients";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { EditClientForm } from "@/components/admin/clients/EditClientForm";
import { formatDate } from "@/lib/utils";

// Same cache()-per-request + generateMetadata() pattern as the project/lead
// detail pages (src/app/admin/projects/[id]/page.tsx) — calling notFound()
// from generateMetadata() is what makes an unknown client id return a real
// 404 instead of a 200 with 404-shaped content. See src/lib/page-guards.ts.
const getClientOr404 = cache(async (id: string) => {
  await requireAdmin();
  const client = await getClientById(id);
  if (!client) notFound();
  return client;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const client = await getClientOr404(params.id);
  return { title: client.companyName };
}

export const dynamic = "force-dynamic";

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const client = await getClientOr404(params.id);

  return (
    <div>
      <Link
        href="/admin/clients"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to clients
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">{client.companyName}</h1>
          {client.convertedFromLead && (
            <p className="mt-1 text-sm text-charcoal-muted">
              Converted from lead{" "}
              <Link href={`/admin/leads/${client.convertedFromLead.id}`} className="text-crimson hover:text-crimson-hover">
                {client.convertedFromLead.name}
              </Link>
            </p>
          )}
        </div>
        <StatusBadge value={client.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Field label="Industry" value={client.industry || "—"} />
              <Field label="Phone" value={client.phone || "—"} />
              <Field label="Email" value={client.email || "—"} />
              <Field label="Client since" value={formatDate(client.createdAt)} />
            </dl>
            {client.address && (
              <p className="mt-4 text-sm text-charcoal-muted">{client.address}</p>
            )}
            <div className="mt-4 border-t border-hairline pt-4">
              <EditClientForm
                clientId={client.id}
                initial={{
                  companyName: client.companyName,
                  industry: client.industry ?? "",
                  phone: client.phone ?? "",
                  email: client.email ?? "",
                  address: client.address ?? "",
                  status: client.status,
                }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Projects" description={`${client.projects.length} project${client.projects.length === 1 ? "" : "s"}`} />
            {client.projects.length === 0 ? (
              <EmptyState title="No projects yet" />
            ) : (
              <ul className="space-y-2">
                {client.projects.map((project) => (
                  <li key={project.id} className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3 text-sm">
                    <div>
                      <Link href={`/admin/projects/${project.id}`} className="font-medium text-charcoal-dark hover:text-violet-600">
                        {project.title}
                      </Link>
                      {project.deadline && <p className="text-xs text-charcoal-muted">Due {formatDate(project.deadline)}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-charcoal-muted">{project.computedProgress}%</span>
                      <StatusBadge value={project.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Portal login" />
            {client.user ? (
              <div className="text-sm">
                <p className="text-charcoal-dark">{client.user.name}</p>
                <p className="text-charcoal-muted">{client.user.email}</p>
                <div className="mt-2">
                  <StatusBadge value={client.user.status} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-charcoal-muted">No portal login yet.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-charcoal-muted">{label}</dt>
      <dd className="mt-1 text-charcoal-dark">{value}</dd>
    </div>
  );
}
