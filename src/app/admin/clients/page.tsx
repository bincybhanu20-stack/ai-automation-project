import type { Metadata } from "next";
import { Users2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getClients } from "@/lib/services/admin/clients";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Clients" };
}

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.trim() || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { clients, total, totalPages } = await getClients({ q, page });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Clients</h1>
      <p className="mt-1 text-sm text-slate-400">{total} total</p>

      <form method="get" className="my-6 flex max-w-sm gap-2">
        <FormField
          id="q"
          name="q"
          label="Search"
          placeholder="Search by company name"
          defaultValue={q}
          className="flex-1"
        />
        <Button type="submit" size="sm" className="self-end">
          Search
        </Button>
      </form>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users2}
          title={q ? "No clients match that search" : "No clients yet"}
          description={q ? undefined : "Clients are created by converting a qualified lead."}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Company</Th>
                <Th>Status</Th>
                <Th>Portal login</Th>
                <Th>Projects</Th>
                <Th>Created</Th>
              </tr>
            </Thead>
            <Tbody>
              {clients.map((client) => (
                <Tr key={client.id}>
                  <Td className="font-medium text-slate-100">{client.companyName}</Td>
                  <Td>
                    <StatusBadge value={client.status} />
                  </Td>
                  <Td>{client.user?.email ?? <span className="text-slate-600">None yet</span>}</Td>
                  <Td>{client._count.projects}</Td>
                  <Td>{formatDate(client.createdAt)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/admin/clients?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
          />
        </>
      )}
    </div>
  );
}
