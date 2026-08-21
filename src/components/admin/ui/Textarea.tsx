import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/** Admin's light-theme labeled textarea — mirrors
 * components/ui/Textarea.tsx's prop shape exactly. */
export function TextareaField({ label, id, className, ...props }: TextareaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-dark">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(
          "w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-charcoal-dark placeholder:text-charcoal-muted focus:outline-none focus:ring-2 focus:ring-crimson/40 focus:border-crimson",
          className
        )}
        {...props}
      />
    </div>
  );
}
