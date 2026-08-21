import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getTasks } from "@/lib/services/admin/tasks";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";
import { Pagination } from "@/components/admin/Pagination";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "Tasks" };
}

export const dynamic = "force-dynamic";

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await requireAdmin();
  const q = searchParams.q?.trim() || undefined;
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const { tasks, total, totalPages } = await getTasks({ q, page });
  const now = new Date();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
      <p className="mt-1 text-sm text-slate-400">{total} total</p>

      <form method="get" className="my-6 flex max-w-sm gap-2">
        <FormField id="q" name="q" label="Search" placeholder="Search by title" defaultValue={q} className="flex-1" />
        <Button type="submit" size="sm" className="self-end">
          Search
        </Button>
      </form>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={q ? "No tasks match that search" : "No tasks yet"}
          description={q ? undefined : "Tasks belong to projects — create a project first."}
        />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Task</Th>
                <Th>Project</Th>
                <Th>Assignee</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
                <Th>Due date</Th>
              </tr>
            </Thead>
            <Tbody>
              {tasks.map((task) => {
                const overdue = task.status !== "COMPLETED" && task.dueDate && task.dueDate < now;
                return (
                  <Tr key={task.id}>
                    <Td className="font-medium text-slate-100">{task.title}</Td>
                    <Td>{task.project.title}</Td>
                    <Td>{task.assignee?.name ?? <span className="text-slate-600">Unassigned</span>}</Td>
                    <Td>
                      <StatusBadge value={task.status} />
                    </Td>
                    <Td>
                      <StatusBadge value={task.priority} />
                    </Td>
                    <Td className={cn(overdue && "font-medium text-red-400")}>
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                      {overdue && " (overdue)"}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/admin/tasks?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`}
          />
        </>
      )}
    </div>
  );
}
