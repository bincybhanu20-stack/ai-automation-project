"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users2,
  FolderKanban,
  CheckSquare,
  Bell,
  BarChart3,
  Workflow,
  ScrollText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, roles: ["ADMIN"] as Role[] },
  { href: "/admin/leads", label: "Leads", icon: UserPlus, roles: ["ADMIN"] as Role[] },
  { href: "/admin/clients", label: "Clients", icon: Users2, roles: ["ADMIN"] as Role[] },
  // The one item PROJECT_MANAGER can also reach — matches the /admin/projects
  // carve-out in src/lib/roles.ts's ROUTE_ROLE_MAP.
  { href: "/admin/projects", label: "Projects", icon: FolderKanban, roles: ["ADMIN", "PROJECT_MANAGER"] as Role[] },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare, roles: ["ADMIN"] as Role[] },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN"] as Role[] },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["ADMIN"] as Role[] },
  { href: "/admin/automations", label: "Automations", icon: Workflow, roles: ["ADMIN"] as Role[] },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN"] as Role[] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] as Role[] },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({
  pathname,
  items,
  onNavigate,
}: {
  pathname: string;
  items: typeof NAV_ITEMS;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      {items.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sky-500/10 text-sky-300"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Every /admin/* page independently re-checks its own access (that's the
 * real security boundary — see admin-guard.ts) — this filtering is purely a
 * UX improvement so a PROJECT_MANAGER who can only reach /admin/projects
 * doesn't see nine other links that would just bounce them to
 * /unauthorized. Filtering happens by ROLE only, never by anything the
 * client could tamper with (this is a session prop passed from a server
 * component that already read it from the signed cookie).
 */
export function AdminSidebar({ role }: { role?: Role }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = role ? NAV_ITEMS.filter((item) => item.roles.includes(role)) : NAV_ITEMS;
  const homeHref = role === "PROJECT_MANAGER" ? "/admin/projects" : "/admin";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-white/5 px-3 py-6 lg:block">
        <Link href={homeHref} className="gradient-text mb-6 block px-3 text-lg font-bold">
          ClientFlow
        </Link>
        <NavLinks pathname={pathname} items={items} />
      </aside>

      {/* Mobile top bar + toggle */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 lg:hidden">
        <Link href={homeHref} className="gradient-text text-lg font-bold">
          ClientFlow
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div id="admin-mobile-nav" className="border-b border-white/5 px-3 py-3 lg:hidden">
          <NavLinks pathname={pathname} items={items} onNavigate={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
