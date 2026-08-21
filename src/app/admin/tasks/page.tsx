import type { Metadata } from "next";
import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getTasks } from "@/lib/services/admin/tasks";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/ui/Table";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Pagination } from "@/components/admin/ui/Pagination";
import { FormField } from "@/components/admin/ui/FormField";
import { Button } from "@/components/admin/ui/Button";
import { DeleteTaskButton } from "@/components/admin/tasks/DeleteTaskButton";
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-dark">Tasks</h1>
          <p className="mt-1 text-sm text-charcoal-muted">{total} total</p>
        </div>
        <Link href="/admin/tasks/new">
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Task
          </Button>
        </Link>
      </div>

      <form method="get" className="mb-6 flex max-w-sm gap-2">
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
                <Th>Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {tasks.map((task) => {
                const overdue = task.status !== "COMPLETED" && task.dueDate && task.dueDate < now;
                return (
                  <Tr key={task.id}>
                    <Td className="font-medium text-charcoal-dark">
                      <Link href={`/admin/tasks/${task.id}`} className="hover:text-amber-600">
                        {task.title}
                      </Link>
                    </Td>
                    <Td>{task.project.title}</Td>
                    <Td>{task.assignee?.name ?? <span className="text-charcoal-muted">Unassigned</span>}</Td>
                    <Td>
                      <StatusBadge value={task.status} />
                    </Td>
                    <Td>
                      <StatusBadge value={task.priority} />
                    </Td>
                    <Td className={cn(overdue && "font-medium text-red-600")}>
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                      {overdue && " (overdue)"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/tasks/${task.id}`}>
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                        </Link>
                        <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
                      </div>
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
