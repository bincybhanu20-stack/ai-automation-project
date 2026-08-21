import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { requireProjectAccessForPage } from "@/lib/page-guards";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Runs the authorization check here FIRST, before the page body starts
// streaming — see the long comment on requireProjectAccessForPage() in
// page-guards.ts for why that's what makes notFound()/redirect() set the
// correct HTTP status. React's cache() means this doesn't cost a second
// database round trip: the page body below reuses this exact result.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { project } = await requireProjectAccessForPage(params.id);
  return { title: project.title };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // THE cross-client isolation test target: requireProjectAccessForPage
  // loads the project, finds its clientId, and confirms the logged-in
  // client's OWN client record matches — all server-side, all from the
  // database, never from anything the URL or the client sent about itself.
  // A client visiting another client's project id lands on a plain 404.
  const { session, project } = await requireProjectAccessForPage(params.id);

  return (
    <main className="min-h-screen py-12">
      <Container size="wide">
        <DashboardHeader title="Project Details" userName={session.name} userRole={session.role} />

        <Link
          href="/portal"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to portal
        </Link>

        <Card>
          <CardHeader title={project.title} description={project.description ?? undefined} />
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="mt-1 text-slate-200">{project.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Priority</dt>
              <dd className="mt-1 text-slate-200">{project.priority}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Progress</dt>
              <dd className="mt-1 text-slate-200">{project.progress}%</dd>
            </div>
            <div>
              <dt className="text-slate-500">Deadline</dt>
              <dd className="mt-1 text-slate-200">{formatDate(project.deadline)}</dd>
            </div>
          </dl>
        </Card>
      </Container>
    </main>
  );
}
