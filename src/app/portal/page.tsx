import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { requireRoleForPage } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Client portal" };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await requireRoleForPage(["CLIENT"]);

  // Scoped by the LOGGED-IN USER's id, never by anything from the URL or a
  // form field — this is what makes it impossible for one client to load
  // another client's dashboard by guessing an id.
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: { projects: { orderBy: { updatedAt: "desc" } } },
  });

  return (
    <main className="min-h-screen py-12">
      <Container size="wide">
        <DashboardHeader title="Client Portal" userName={session.name} userRole={session.role} />

        {!client ? (
          <Card>
            <p className="text-sm text-slate-400">
              No client profile is linked to your account yet. Contact your account
              manager.
            </p>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader title={client.companyName} description={client.industry ?? undefined} />
              <p className="text-sm text-slate-400">Status: {client.status}</p>
            </Card>

            <h2 className="mb-3 text-lg font-semibold text-slate-100">Your projects</h2>
            {client.projects.length === 0 ? (
              <Card>
                <p className="text-sm text-slate-400">No projects yet.</p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {client.projects.map((project) => (
                  <Link key={project.id} href={`/portal/projects/${project.id}`}>
                    <Card hoverable>
                      <p className="font-medium text-slate-100">{project.title}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {project.status} · {project.progress}% complete
                      </p>
                      <p className="mt-2 text-xs text-slate-600">
                        Updated {formatDate(project.updatedAt)}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
