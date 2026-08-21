import type { Metadata } from "next";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getUsers } from "@/lib/services/admin/users";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/ui/Table";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Pagination } from "@/components/admin/ui/Pagination";
import { Button } from "@/components/admin/ui/Button";
import { UsersFilterBar } from "@/components/admin/users/UsersFilterBar";
import { formatDate } from "@/lib/utils";
import type { Role } from "@prisma/client";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Users" };
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string; page?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.trim() || undefined;
  const role = searchParams.role || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { users, total, totalPages } = await getUsers({ q, role: role as Role | undefined, page });
  const hasActiveFilters = Boolean(q || role);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    params.set("page", String(targetPage));
    return `/admin/users?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">Users</h1>
          <p className="mt-1 text-sm text-charcoal-muted">{total} total</p>
        </div>
        <Link href="/admin/users/new">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add User
          </Button>
        </Link>
      </div>

      <UsersFilterBar q={q} role={role} hasActiveFilters={hasActiveFilters} />

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasActiveFilters ? "No users match these filters" : "No users yet"}
          description={hasActiveFilters ? "Try clearing a filter or searching for something else." : undefined}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium text-charcoal-dark">
                    <Link href={`/admin/users/${user.id}`} className="hover:text-teal-600">
                      {user.name}
                    </Link>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>{user.role.replace(/_/g, " ")}</Td>
                  <Td>
                    <StatusBadge value={user.status} />
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button size="sm" variant="ghost">
                        Manage
                      </Button>
                    </Link>
                  </Td>
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
