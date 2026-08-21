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

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: UserPlus },
  { href: "/admin/clients", label: "Clients", icon: Users2 },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/automations", label: "Automations", icon: Workflow },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Admin">
      {NAV_ITEMS.map((item) => {
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

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-white/5 px-3 py-6 lg:block">
        <Link href="/admin" className="gradient-text mb-6 block px-3 text-lg font-bold">
          ClientFlow
        </Link>
        <NavLinks pathname={pathname} />
      </aside>

      {/* Mobile top bar + toggle */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 lg:hidden">
        <Link href="/admin" className="gradient-text text-lg font-bold">
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
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
