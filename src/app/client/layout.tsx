import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { Container } from "@/components/ui/Container";

/**
 * Shell for /client and /client/projects/[id]. Like admin/layout.tsx, this
 * does NOT perform the security check itself — each page's own
 * requireClient() call (via generateMetadata, see src/lib/client-guard.ts)
 * is the actual enforcement. This file only reads the session to display a
 * name, never to decide who's allowed in.
 */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <Container size="wide">
          <div className="flex items-center justify-between py-4">
            <Link href="/client" className="gradient-text text-lg font-bold">
              ClientFlow
            </Link>
            <div className="flex items-center gap-4">
              <p className="hidden text-sm text-slate-400 sm:block">
                {session ? <span className="text-slate-200">{session.name}</span> : "—"}
              </p>
              <LogoutButton />
            </div>
          </div>
        </Container>
      </header>
      <Container size="wide" className="py-8">
        {children}
      </Container>
    </div>
  );
}
