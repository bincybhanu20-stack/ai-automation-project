import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getAutomationRuns } from "@/lib/services/admin/automations";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Pagination } from "@/components/admin/Pagination";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Automations" };
}

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["PENDING", "RUNNING", "SUCCESS", "FAILED"] as const;

export default async function AdminAutomationsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdmin();
  const status = searchParams.status || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { runs, total, totalPages } = await getAutomationRuns({ status, page });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Automations</h1>
      <p className="mt-1 text-sm text-slate-400">{total} logged runs</p>

      <div className="my-6 flex flex-wrap gap-2">
        <FilterChip label="All" href="/admin/automations" active={!status} />
        {STATUS_FILTERS.map((s) => (
          <FilterChip key={s} label={s} href={`/admin/automations?status=${s}`} active={status === s} />
        ))}
      </div>

      {runs.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title={status ? `No ${status.toLowerCase()} runs` : "No automation runs yet"}
          description="Automation runs are logged whenever an event (like a new lead) tries to trigger n8n."
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Workflow</Th>
                <Th>Entity</Th>
                <Th>Status</Th>
                <Th>Error</Th>
                <Th>Started</Th>
                <Th>Completed</Th>
              </tr>
            </Thead>
            <Tbody>
              {runs.map((run) => (
                <Tr key={run.id}>
                  <Td className="font-medium text-slate-100">{run.workflowName}</Td>
                  <Td>
                    {run.entityType}
                    {run.entityType === "Lead" && run.entityId && (
                      <>
                        {" "}
                        <Link href={`/admin/leads/${run.entityId}`} className="text-sky-400 hover:text-sky-300">
                          (view)
                        </Link>
                      </>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge value={run.status} />
                  </Td>
                  <Td className={cn("max-w-xs truncate", run.errorMessage && "text-red-400")}>
                    {run.errorMessage ?? "—"}
                  </Td>
                  <Td>{formatDate(run.startedAt)}</Td>
                  <Td>{run.completedAt ? formatDate(run.completedAt) : "—"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/admin/automations?${status ? `status=${status}&` : ""}page=${p}`}
          />
        </>
      )}
    </div>
  );
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        active
          ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
          : "border-white/10 text-slate-400 hover:text-slate-100"
      )}
    >
      {label}
    </Link>
  );
}
