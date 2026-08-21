import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

interface PublicSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  placeholder?: string;
}

export function PublicSelect({
  label,
  id,
  className,
  options,
  placeholder = "Select an option",
  ...props
}: PublicSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-dark">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn(
            "w-full appearance-none rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-charcoal-dark pub-focus",
            className
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
