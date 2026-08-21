import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getProjects } from "@/lib/services/admin/projects";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Projects" };
}

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.trim() || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { projects, total, totalPages } = await getProjects({ q, page });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
      <p className="mt-1 text-sm text-slate-400">{total} total</p>

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
          description={q ? undefined : "Projects are created from a converted lead or an existing client."}
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
                  <Td className="font-medium text-slate-100">{project.title}</Td>
                  <Td>{project.client.companyName}</Td>
                  <Td>
                    <StatusBadge value={project.status} />
                  </Td>
                  <Td>
                    <StatusBadge value={project.priority} />
                  </Td>
                  <Td>{project.progress}%</Td>
                  <Td>{project.manager?.name ?? <span className="text-slate-600">Unassigned</span>}</Td>
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

      <p className="mt-6 text-xs text-slate-600">
        Full project management (create/edit/task boards) is a dedicated module.
        This confirms the route is admin-protected and reads real project data —
        creating a project from a lead already works on the lead detail page.
      </p>
    </div>
  );
}
