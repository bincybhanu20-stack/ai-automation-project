import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireProjectStaff } from "@/lib/admin-guard";
import { getClientOptions } from "@/lib/services/admin/clients";
import { getProjectManagerCandidates } from "@/lib/services/admin/projects";
import { CreateProjectForm } from "@/components/admin/projects/CreateProjectForm";

export async function generateMetadata(): Promise<Metadata> {
  await requireProjectStaff();
  return { title: "New Project" };
}

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const session = await requireProjectStaff();
  const [clients, managerCandidates] = await Promise.all([getClientOptions(), getProjectManagerCandidates()]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-100">New Project</h1>

      <CreateProjectForm
        clients={clients}
        managerCandidates={managerCandidates}
        showManagerPicker={session.role === "ADMIN"}
      />
    </div>
  );
}
