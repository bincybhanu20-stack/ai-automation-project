import Link from "next/link";
import { FormField } from "@/components/admin/ui/FormField";
import { SelectField } from "@/components/admin/ui/Select";
import { Button } from "@/components/admin/ui/Button";

const STATUS_OPTIONS = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
const SOURCE_OPTIONS = ["WEBSITE", "REFERRAL", "API", "MANUAL", "N8N_WEBHOOK", "OTHER"] as const;

interface LeadsFilterBarProps {
  q?: string;
  status?: string;
  source?: string;
  assignedTo?: string;
  staff: { id: string; name: string }[];
  hasActiveFilters: boolean;
}

/**
 * A plain <form method="get"> — submitting it just navigates to
 * /admin/leads?q=...&status=...&... . No client-side JavaScript required:
 * the URL is the entire state of the search/filter, which also makes every
 * filtered view bookmarkable and shareable.
 */
export function LeadsFilterBar({ q, status, source, assignedTo, staff, hasActiveFilters }: LeadsFilterBarProps) {
  return (
    <form method="get" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <FormField
          id="q"
          name="q"
          label="Search"
          defaultValue={q}
          placeholder="Name, email or company"
        />
      </div>

      <SelectField id="status" name="status" label="Status" options={STATUS_OPTIONS} defaultValue={status} />
      <SelectField id="source" name="source" label="Source" options={SOURCE_OPTIONS} defaultValue={source} />

      <div>
        <label htmlFor="assignedTo" className="mb-1.5 block text-sm font-medium text-charcoal">
          Assigned to
        </label>
        <select
          id="assignedTo"
          name="assignedTo"
          defaultValue={assignedTo}
          className="border border-hairline bg-white text-charcoal-dark focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson w-full rounded-lg px-3.5 py-2.5 text-sm"
        >
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end gap-2 lg:col-span-5">
        <Button type="submit" size="sm">
          Apply filters
        </Button>
        {hasActiveFilters && (
          <Link
            href="/admin/leads"
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-charcoal-muted hover:text-charcoal-dark"
          >
            Clear
          </Link>
        )}
      </div>
    </form>
  );
}
