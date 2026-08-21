import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { getProjectOptions } from "@/lib/services/admin/tasks";
import { getAssignableStaff } from "@/lib/services/admin/leads";
import { CreateTaskForm } from "@/components/admin/tasks/CreateTaskForm";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "New Task" };
}

export const dynamic = "force-dynamic";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  await requireAdmin();
  const [projects, assignees] = await Promise.all([getProjectOptions(), getAssignableStaff()]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/tasks"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to tasks
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-charcoal-dark">New Task</h1>

      <CreateTaskForm projects={projects} assignees={assignees} defaultProjectId={searchParams.projectId} />
    </div>
  );
}
