import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogoutButton } from "@/components/admin/LogoutButton";
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
    <div className="flex min-h-screen flex-col bg-white text-charcoal-dark lg:flex-row">
      <AdminSidebar role={session?.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end border-b border-hairline px-6 py-3 lg:flex">
          <div className="flex items-center gap-4">
            <p className="text-sm text-charcoal-muted">
              {session ? (
                <>
                  <span className="text-charcoal-dark">{session.name}</span> ·{" "}
                  {session.role.replace("_", " ")}
                </>
              ) : (
                "—"
              )}
            </p>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 bg-surface px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
