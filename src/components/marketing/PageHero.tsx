import { Container } from "@/components/ui/Container";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Consistent page-top header used by every public page except the home page. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="border-b border-white/5 py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-4xl font-bold text-slate-100 sm:text-5xl">{title}</h1>
          {description && <p className="mt-4 text-lg text-slate-400">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
