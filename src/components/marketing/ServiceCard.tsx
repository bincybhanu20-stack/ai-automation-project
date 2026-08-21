import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicCard } from "./ui/Card";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  href: string;
}

export function ServiceCard({ icon: Icon, name, description, href }: ServiceCardProps) {
  return (
    <PublicCard hoverable className="group flex h-full flex-col">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-crimson-light">
        <Icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-charcoal-dark">{name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-crimson group-hover:gap-2.5"
      >
        Learn more
        <ArrowRight className="h-3.5 w-3.5 transition-all" aria-hidden="true" />
      </Link>
    </PublicCard>
  );
}
