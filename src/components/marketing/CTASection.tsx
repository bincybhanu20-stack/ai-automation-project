import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  title: string;
  description: string;
  buttonLabel?: string;
  href?: string;
}

/** Full-width call-to-action banner, used at the bottom of most public pages. */
export function CTASection({
  title,
  description,
  buttonLabel = "Request a Quote",
  href = "/request-quote",
}: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="glass-card rounded-2xl px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold text-slate-100">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{description}</p>
          <Link
            href={href}
            className="gradient-button mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white"
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
