import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getLeads, getAssignableStaff } from "@/lib/services/admin/leads";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { LeadsFilterBar } from "@/components/admin/leads/LeadsFilterBar";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Leads" };
}

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: {
    q?: string;
    status?: string;
    source?: string;
    assignedTo?: string;
    page?: string;
  };
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const filters = {
    q: searchParams.q?.trim() || undefined,
    status: searchParams.status || undefined,
    source: searchParams.source || undefined,
    assignedTo: searchParams.assignedTo || undefined,
    page: searchParams.page ? Number(searchParams.page) : 1,
  };

  const [{ leads, total, page, totalPages }, staff] = await Promise.all([
    getLeads(filters),
    getAssignableStaff(),
  ]);

  const hasActiveFilters = Boolean(filters.q || filters.status || filters.source || filters.assignedTo);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.status) params.set("status", filters.status);
    if (filters.source) params.set("source", filters.source);
    if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
    params.set("page", String(targetPage));
    return `/admin/leads?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Leads</h1>
          <p className="mt-1 text-sm text-slate-400">{total} total</p>
        </div>
      </div>

      <LeadsFilterBar
        q={filters.q}
        status={filters.status}
        source={filters.source}
        assignedTo={filters.assignedTo}
        staff={staff}
        hasActiveFilters={hasActiveFilters}
      />

      {leads.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={hasActiveFilters ? "No leads match these filters" : "No leads yet"}
          description={
            hasActiveFilters
              ? "Try clearing a filter or searching for something else."
              : "New leads submitted through the public site will show up here."
          }
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Lead</Th>
                <Th>Status</Th>
                <Th>Source</Th>
                <Th>Assigned to</Th>
                <Th>Score</Th>
                <Th>Created</Th>
              </tr>
            </Thead>
            <Tbody>
              {leads.map((lead) => (
                <Tr key={lead.id}>
                  <Td>
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-slate-100 hover:text-sky-400">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-slate-500">{lead.company || lead.email}</p>
                  </Td>
                  <Td>
                    <StatusBadge value={lead.status} />
                  </Td>
                  <Td>{lead.source.replace(/_/g, " ")}</Td>
                  <Td>{lead.assignedTo?.name ?? <span className="text-slate-600">Unassigned</span>}</Td>
                  <Td>{lead.qualificationScore ?? <span className="text-slate-600">—</span>}</Td>
                  <Td>{formatDate(lead.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
