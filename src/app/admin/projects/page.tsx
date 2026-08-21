import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { requireProjectStaff } from "@/lib/admin-guard";
import { getProjects } from "@/lib/services/admin/projects";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/ui/Table";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Pagination } from "@/components/admin/ui/Pagination";
import { FormField } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  await requireProjectStaff();
  return { title: "Projects" };
}

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  // Open to ADMIN and PROJECT_MANAGER (see src/lib/roles.ts's /admin/projects
  // carve-out and src/lib/admin-guard.ts's requireProjectStaff). Everyone
  // who reaches this list can SEE every project — internal staff visibility
  // is intentionally broad, per the same principle requireClientAccess()
  // already documents. Which projects a PROJECT_MANAGER can actually EDIT
  // is the separate, narrower check on the detail page.
  await requireProjectStaff();
  const q = searchParams.q?.trim() || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { projects, total, totalPages } = await getProjects({ q, page });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">Projects</h1>
          <p className="mt-1 text-sm text-charcoal-muted">{total} total</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Project
        </Link>
      </div>

      <form method="get" className="my-6 flex max-w-sm gap-2">
        <FormField id="q" name="q" label="Search" placeholder="Search by title" defaultValue={q} className="flex-1" />
        <Button type="submit" size="sm" className="self-end">
          Search
        </Button>
      </form>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={q ? "No projects match that search" : "No projects yet"}
          description={q ? undefined : "Create your first project, or create one from a qualified lead."}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Project</Th>
                <Th>Client</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Progress</Th>
                <Th>Manager</Th>
                <Th>Tasks</Th>
              </tr>
            </Thead>
            <Tbody>
              {projects.map((project) => (
                <Tr key={project.id}>
                  <Td className="font-medium text-charcoal-dark">
                    <Link href={`/admin/projects/${project.id}`} className="hover:text-violet-600">
                      {project.title}
                    </Link>
                  </Td>
                  <Td>{project.client.companyName}</Td>
                  <Td>
                    <StatusBadge value={project.status} />
                  </Td>
                  <Td>
                    <StatusBadge value={project.priority} />
                  </Td>
                  <Td>{project.computedProgress}%</Td>
                  <Td>{project.manager?.name ?? <span className="text-charcoal-muted">Unassigned</span>}</Td>
                  <Td>{project._count.tasks}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/admin/projects?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
          />
        </>
      )}
    </div>
  );
}
