import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { getAuthSession } from "@/lib/auth";

/**
 * Shell for every /admin/* page: sidebar nav + a top bar showing who's
 * signed in. This layout does NOT perform the security check itself —
 * each page's own requireAdmin() call (via generateMetadata, see
 * src/lib/admin-guard.ts) is the actual enforcement, and Next.js resolves
 * that BEFORE this layout's content is ever sent to an unauthorized
 * visitor. This file only reads the session to display a name — never to
 * decide who's allowed in.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end border-b border-white/5 px-6 py-3 lg:flex">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-400">
              {session ? (
                <>
                  <span className="text-slate-200">{session.name}</span> ·{" "}
                  {session.role.replace("_", " ")}
                </>
              ) : (
                "—"
              )}
            </p>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
