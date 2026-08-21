import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { requireRoleForPage } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

async function getStats() {
  const [userCount, clientCount, leadCount, projectCount, taskCount] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.lead.count(),
    prisma.project.count(),
    prisma.task.count(),
  ]);
  return { userCount, clientCount, leadCount, projectCount, taskCount };
}

export default async function AdminPage() {
  // The real enforcement: ADMIN only. Middleware already redirected anyone
  // else before this ran, but this check is what actually protects the data
  // below — never trust the middleware alone.
  const session = await requireRoleForPage(["ADMIN"]);
  const stats = await getStats();

  const cards = [
    { label: "Users", value: stats.userCount },
    { label: "Clients", value: stats.clientCount },
    { label: "Leads", value: stats.leadCount },
    { label: "Projects", value: stats.projectCount },
    { label: "Tasks", value: stats.taskCount },
  ];

  return (
    <main className="min-h-screen py-12">
      <Container size="wide">
        <DashboardHeader title="Admin Dashboard" userName={session.name} userRole={session.role} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {cards.map((c) => (
            <Card key={c.label}>
              <p className="text-sm text-slate-400">{c.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-100">{c.value}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-600">
          Full lead/client/project management modules land in later phases. This
          confirms the admin route is protected and reading real platform data.
        </p>
      </Container>
    </main>
  );
}
