import type { Metadata } from "next";
import { Search, PenTool, Rocket, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";

export const metadata: Metadata = {
  title: "About",
  description: "How we work with clients, from first conversation to ongoing support.",
};

const PROCESS = [
  {
    icon: Search,
    title: "Discover",
    description: "We start by understanding your workflow — what's manual today, and where it breaks down.",
  },
  {
    icon: PenTool,
    title: "Design",
    description: "We scope a system around your actual process, not a generic template.",
  },
  {
    icon: Rocket,
    title: "Build & launch",
    description: "Iterative delivery with regular check-ins, so there are no surprises at launch.",
  },
  {
    icon: RefreshCw,
    title: "Support & improve",
    description: "After launch, we keep monitoring, maintaining and refining as your needs change.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="We build the systems behind the client relationship"
        description="ClientFlow exists because too many growing teams run their client pipeline across spreadsheets, inboxes and sticky notes. We build the software that replaces that — and we use it ourselves."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-slate-100">How we work</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, i) => (
              <div key={step.title}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10 text-sm font-semibold text-sky-400">
                  {i + 1}
                </div>
                <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Want to work together?"
        description="Tell us about your project and we'll get back to you within one business day."
      />
    </>
  );
}
