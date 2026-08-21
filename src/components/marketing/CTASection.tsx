import { Container } from "@/components/ui/Container";
import { PublicButton } from "./ui/Button";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  title: string;
  description: string;
  buttonLabel?: string;
  href?: string;
  /** Optional second, lower-emphasis button — e.g. the homepage's final CTA
   * pairs "Start Your Project" with "Contact Us". Omit for the common
   * single-button case every other page uses. */
  secondaryLabel?: string;
  secondaryHref?: string;
}

/** Full-width call-to-action banner, used at the bottom of most public pages. */
export function CTASection({
  title,
  description,
  buttonLabel = "Request a Quote",
  href = "/request-quote",
  secondaryLabel,
  secondaryHref = "/contact",
}: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="rounded-2xl bg-charcoal-dark px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">{description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PublicButton href={href}>
              {buttonLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PublicButton>
            {secondaryLabel && (
              <PublicButton href={secondaryHref} variant="secondary" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                {secondaryLabel}
              </PublicButton>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
