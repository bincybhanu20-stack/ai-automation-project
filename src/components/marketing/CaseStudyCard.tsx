import { Check } from "lucide-react";
import { PublicCard } from "./ui/Card";
import type { LucideIcon } from "lucide-react";

interface CaseStudyCardProps {
  category: string;
  name: string;
  description: string;
  technology: readonly string[];
  outcomes: readonly string[];
  icon: LucideIcon;
}

export function CaseStudyCard({
  category,
  name,
  description,
  technology,
  outcomes,
  icon: Icon,
}: CaseStudyCardProps) {
  return (
    <PublicCard hoverable className="flex h-full flex-col">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson-light">
        <Icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-crimson">{category}</p>
      <h3 className="mt-1.5 text-lg font-semibold text-charcoal-dark">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal">{description}</p>

      <ul className="mt-4 space-y-2">
        {outcomes.map((outcome) => (
          <li key={outcome} className="flex items-start gap-2 text-sm text-charcoal">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-4">
        {technology.map((tech) => (
          <span
            key={tech}
            className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-charcoal-muted"
          >
            {tech}
          </span>
        ))}
      </div>
    </PublicCard>
  );
}
