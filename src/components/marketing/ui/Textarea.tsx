import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface PublicTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function PublicTextarea({ label, id, className, ...props }: PublicTextareaProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-charcoal-dark">
        {label}
      </label>
      <textarea
        id={id}
        className={cn(
          "w-full rounded-lg border border-hairline bg-white px-3.5 py-2.5 text-sm text-charcoal-dark placeholder:text-charcoal-muted pub-focus",
          className
        )}
        {...props}
      />
    </div>
  );
}
