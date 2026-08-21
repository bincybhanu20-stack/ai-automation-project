import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import { CreateUserForm } from "@/components/admin/users/CreateUserForm";

export async function generateMetadata(): Promise<Metadata> {
  await requireAdmin();
  return { title: "New User" };
}

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-crimson hover:text-crimson-hover"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to users
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-charcoal-dark">New User</h1>

      <CreateUserForm />
    </div>
  );
}
