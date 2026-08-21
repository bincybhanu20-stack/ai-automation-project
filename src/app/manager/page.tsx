import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { requireRoleForPage } from "@/lib/page-guards";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Staff dashboard" };
export const dynamic = "force-dynamic";

export default async function ManagerPage() {
  // Internal staff area: ADMIN, PROJECT_MANAGER and TEAM_MEMBER. A CLIENT
  // hitting this route is redirected to /unauthorized — enforced here, not
  // just by middleware.
  const session = await requireRoleForPage(["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER"]);

  const [assignedProjects, assignedTasks] = await Promise.all([
    prisma.project.count({ where: { managerId: session.userId } }),
    prisma.task.count({ where: { assigneeId: session.userId } }),
  ]);

  return (
    <main className="min-h-screen py-12">
      <Container size="wide">
        <DashboardHeader title="Staff Dashboard" userName={session.name} userRole={session.role} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-400">Projects you manage</p>
            <p className="mt-1 text-3xl font-bold text-slate-100">{assignedProjects}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-400">Tasks assigned to you</p>
            <p className="mt-1 text-3xl font-bold text-slate-100">{assignedTasks}</p>
          </Card>
        </div>

        <p className="mt-8 text-xs text-slate-600">
          Full project and task management modules land in later phases. This
          confirms the staff route is protected for ADMIN, PROJECT_MANAGER and
          TEAM_MEMBER, and blocked for CLIENT.
        </p>
      </Container>
    </main>
  );
}
