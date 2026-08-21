import { Container } from "@/components/ui/Container";
import type { ReactNode } from "react";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

/** Consistent page-top header used by every inner public page. */
export function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="pub-gradient-bg border-b border-hairline py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-crimson">{eyebrow}</p>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-charcoal-dark sm:text-5xl">{title}</h1>
          {description && <p className="mt-4 text-lg leading-relaxed text-charcoal">{description}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
