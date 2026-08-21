import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getAuditLogs, getAuditLogEntityTypes } from "@/lib/services/admin/audit-logs";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Audit Logs" };
}

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: { entity?: string; page?: string };
}) {
  await requireAdmin();
  const entity = searchParams.entity || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const [{ logs, total, totalPages }, entityTypes] = await Promise.all([
    getAuditLogs({ entity, page }),
    getAuditLogEntityTypes(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
      <p className="mt-1 text-sm text-slate-400">{total} recorded events</p>

      <div className="my-6 flex flex-wrap gap-2">
        <FilterChip label="All" href="/admin/audit-logs" active={!entity} />
        {entityTypes.map((e) => (
          <FilterChip key={e} label={e} href={`/admin/audit-logs?entity=${e}`} active={entity === e} />
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit events yet" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Actor</Th>
                <Th>IP address</Th>
                <Th>When</Th>
              </tr>
            </Thead>
            <Tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td className="font-medium text-slate-100">{log.action}</Td>
                  <Td>
                    {log.entity}
                    {log.entity === "Lead" && log.entityId && (
                      <>
                        {" "}
                        <Link href={`/admin/leads/${log.entityId}`} className="text-sky-400 hover:text-sky-300">
                          (view)
                        </Link>
                      </>
                    )}
                  </Td>
                  <Td>{log.user?.name ?? <span className="text-slate-600">System / public</span>}</Td>
                  <Td className="font-mono text-xs">{log.ipAddress ?? "—"}</Td>
                  <Td>{formatDate(log.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/admin/audit-logs?${entity ? `entity=${entity}&` : ""}page=${p}`}
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
