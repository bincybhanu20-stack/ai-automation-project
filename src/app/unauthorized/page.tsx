import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { getAuthSession, roleHomePath } from "@/lib/auth";

export const metadata: Metadata = { title: "Not authorized" };
export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const session = await getAuthSession();

  return (
    <main className="flex min-h-screen items-center p-4">
      <Container size="narrow">
        <Card className="text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-400" aria-hidden="true" />
          <h1 className="mb-2 text-xl font-semibold text-slate-100">Not authorized</h1>
          <p className="mb-6 text-sm text-slate-400">
            Your account doesn&apos;t have permission to view that page.
          </p>
          <Link
            href={session ? roleHomePath(session.role) : "/login"}
            className="gradient-button inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          >
            {session ? "Back to my dashboard" : "Log in"}
          </Link>
        </Card>
      </Container>
    </main>
  );
}
