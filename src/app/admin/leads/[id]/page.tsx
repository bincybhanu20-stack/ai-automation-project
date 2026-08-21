import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getLeadById, getAssignableStaff } from "@/lib/services/admin/leads";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/utils";
import { AssignLeadControl } from "@/components/admin/leads/AssignLeadControl";
import { ChangeStatusControl } from "@/components/admin/leads/ChangeStatusControl";
import { QualifyLeadButton } from "@/components/admin/leads/QualifyLeadButton";
import { ConvertToClientButton } from "@/components/admin/leads/ConvertToClientButton";
import { CreateProjectForm } from "@/components/admin/leads/CreateProjectForm";
import { AddNoteForm } from "@/components/admin/leads/AddNoteForm";
import { EditLeadForm } from "@/components/admin/leads/EditLeadForm";

// Auth + existence check, cached per request so generateMetadata and the
// page body share one Prisma round trip instead of two. Same pattern as
// requireProjectAccessForPage (src/lib/page-guards.ts) — the check must run
// from generateMetadata so a not-found lead id gets a real HTTP 404, not a
// 200 with 404-shaped content (see that file's comment for the full story).
const getLeadOr404 = cache(async (id: string) => {
  await requireAdmin();
  const lead = await getLeadById(id);
  if (!lead) notFound();
  return lead;
});

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const lead = await getLeadOr404(params.id);
  return { title: lead.name };
}

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, staff] = await Promise.all([getLeadOr404(params.id), getAssignableStaff()]);

  const hasClientLink = Boolean(lead.clientId || lead.convertedClient);

  return (
    <div>
      <Link
        href="/admin/leads"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to leads
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{lead.name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {lead.email} {lead.company && `· ${lead.company}`}
          </p>
        </div>
        <StatusBadge value={lead.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Details" />
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <Field label="Phone" value={lead.phone} />
              <Field label="Source" value={lead.source.replace(/_/g, " ")} />
              <Field label="Service" value={lead.service} />
              <Field label="Budget" value={lead.budgetRange} />
              <Field label="Created" value={formatDate(lead.createdAt)} />
              <Field label="Updated" value={formatDate(lead.updatedAt)} />
            </dl>
            <div className="mt-4 border-t border-white/5 pt-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                Project description
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-300">{lead.message}</p>
            </div>

            <div className="mt-4 border-t border-white/5 pt-4">
              <EditLeadForm
                leadId={lead.id}
                initial={{
                  name: lead.name,
                  email: lead.email,
                  phone: lead.phone ?? "",
                  company: lead.company ?? "",
                  service: lead.service ?? "",
                  budgetRange: lead.budgetRange ?? "",
                  message: lead.message,
                }}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="AI qualification"
              description={
                lead.aiProcessedAt
                  ? `Last run ${formatDate(lead.aiProcessedAt)}`
                  : "Not yet run for this lead."
              }
              action={<QualifyLeadButton leadId={lead.id} />}
            />
            {lead.qualificationScore !== null ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  <span className="text-2xl font-bold text-slate-100">{lead.qualificationScore}</span>
                  <span className="text-sm text-slate-500">/ 100</span>
                </div>
                <p className="text-sm text-slate-300">{lead.qualificationSummary}</p>
                <p className="text-xs text-slate-500">{lead.qualificationReason}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                This lead hasn&apos;t been scored yet. Run AI qualification to get a score and summary.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Notes" description={`${lead.notes.length} note${lead.notes.length === 1 ? "" : "s"}`} />
            <div className="mb-4 space-y-3">
              {lead.notes.length === 0 ? (
                <p className="text-sm text-slate-500">No notes yet.</p>
              ) : (
                lead.notes.map((note) => (
                  <div key={note.id} className="rounded-lg bg-white/[0.03] p-3">
                    <p className="whitespace-pre-wrap text-sm text-slate-300">{note.body}</p>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {note.author?.name ?? "Unknown"} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <AddNoteForm leadId={lead.id} />
          </Card>
        </div>

        {/* Sidebar: actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Assignment" />
            <AssignLeadControl leadId={lead.id} currentAssigneeId={lead.assignedToId} staff={staff} />
          </Card>

          <Card>
            <CardHeader title="Status" />
            <ChangeStatusControl leadId={lead.id} currentStatus={lead.status} />
          </Card>

          <Card>
            <CardHeader title="Conversion" />
            {lead.convertedClient ? (
              <p className="text-sm text-slate-400">
                Converted to client{" "}
                <Link href={`/admin/clients`} className="text-sky-400 hover:text-sky-300">
                  {lead.convertedClient.companyName}
                </Link>
                .
              </p>
            ) : (
              <ConvertToClientButton leadId={lead.id} />
            )}
          </Card>

          <Card>
            <CardHeader title="Project" />
            {lead.convertedProject ? (
              <p className="text-sm text-slate-400">
                Project already created:{" "}
                <Link href="/admin/projects" className="text-sky-400 hover:text-sky-300">
                  {lead.convertedProject.title}
                </Link>
                .
              </p>
            ) : hasClientLink ? (
              <CreateProjectForm leadId={lead.id} defaultTitle={`${lead.company || lead.name} project`} staff={staff} />
            ) : (
              <p className="text-sm text-slate-500">
                Convert this lead to a client first — a project needs a client to belong to.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value || <span className="text-slate-600">—</span>}</dd>
    </div>
  );
}
