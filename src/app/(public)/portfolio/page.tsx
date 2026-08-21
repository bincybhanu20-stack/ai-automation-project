import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { PortfolioGrid } from "@/components/marketing/PortfolioGrid";

export const metadata: Metadata = {
  title: "Website Development Portfolio",
  description:
    "Website Development Portfolio | Elicpesoftware — explore selected websites and digital solutions created to help businesses build stronger brands, improve their online presence and connect with their customers.",
  alternates: { canonical: "/portfolio" },
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="Our Work"
        description="Explore selected websites and digital solutions created to help businesses build stronger brands, improve their online presence and connect with their customers."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <ScrollReveal>
            <PortfolioGrid />
          </ScrollReveal>
        </Container>
      </section>

      {/* Trust */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-20">
        <Container size="narrow" className="text-center">
          <ScrollReveal>
            <h2 className="text-2xl font-bold tracking-tight text-charcoal-dark sm:text-3xl">
              Every Project Starts With a Business Goal
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal">
              Whether the goal is launching a new website, improving an existing digital presence, increasing
              search visibility or generating more leads, we focus on creating solutions that support real
              business objectives.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <CTASection
        title="Have a Project in Mind?"
        description="Let's turn your idea into a professional digital experience."
        buttonLabel="Start Your Project"
      />
    </>
  );
}
