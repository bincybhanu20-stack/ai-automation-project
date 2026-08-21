import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { Container } from "@/components/ui/Container";

/**
 * Shell for /client and /client/projects/[id]. Like admin/layout.tsx, this
 * does NOT perform the security check itself — each page's own
 * requireClient() call (via generateMetadata, see src/lib/client-guard.ts)
 * is the actual enforcement. This file only reads the session to display a
 * name, never to decide who's allowed in.
 *
 * Light theme, reusing components/admin/ui/* and components/admin/
 * LogoutButton — those are purely presentational (no admin-specific access
 * logic), so sharing them here avoids standing up a third near-identical
 * component set for what's now the same visual system as /admin.
 */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-hairline bg-white/90 backdrop-blur-md">
        <Container size="wide">
          <div className="flex items-center justify-between py-4">
            <Link href="/client" className="text-lg font-bold text-charcoal-dark">
              <span className="text-crimson">Elic</span>pesoftware
            </Link>
            <div className="flex items-center gap-4">
              <p className="hidden text-sm text-charcoal-muted sm:block">
                {session ? <span className="text-charcoal-dark">{session.name}</span> : "—"}
              </p>
              <LogoutButton />
            </div>
          </div>
        </Container>
      </header>
      <Container size="wide" className="bg-surface py-8">
        {children}
      </Container>
    </div>
  );
}
