import Link from "next/link";
import { FormField } from "@/components/admin/ui/FormField";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";

const ROLE_OPTIONS = ["ADMIN", "PROJECT_MANAGER", "TEAM_MEMBER", "CLIENT"] as const;

interface UsersFilterBarProps {
  q?: string;
  role?: string;
  hasActiveFilters: boolean;
}

/** Plain <form method="get"> — same pattern as LeadsFilterBar.tsx: the URL
 * is the entire filter state, bookmarkable and shareable, no client JS. */
export function UsersFilterBar({ q, role, hasActiveFilters }: UsersFilterBarProps) {
  return (
    <form method="get" className="mb-6 grid gap-3 sm:grid-cols-3">
      <div className="sm:col-span-2">
        <FormField id="q" name="q" label="Search" defaultValue={q} placeholder="Name or email" />
      </div>

      <SelectField id="role" name="role" label="Role" options={ROLE_OPTIONS} defaultValue={role} />

      <div className="flex items-end gap-2 sm:col-span-3">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        {hasActiveFilters && (
          <Link
            href="/admin/users"
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-charcoal-muted hover:text-charcoal-dark"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
