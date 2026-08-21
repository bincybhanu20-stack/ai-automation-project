import { LogoutButton } from "./LogoutButton";

interface DashboardHeaderProps {
  title: string;
  userName: string;
  userRole: string;
}

/** Shared header for the three protected dashboards (/admin, /manager, /portal). */
export function DashboardHeader({ title, userName, userRole }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Signed in as <span className="text-slate-200">{userName}</span> ·{" "}
          <span className="text-slate-200">{userRole.replace("_", " ")}</span>
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}
