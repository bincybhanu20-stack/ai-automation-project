import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { LeadCaptureForm } from "@/components/leads/LeadCaptureForm";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell us about your project — service, budget and timeline — and get a response within one business day.",
  alternates: { canonical: "/request-quote" },
};

export default function RequestQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Request a Quote"
        title="Tell us about your project"
        description="The more detail you share, the faster we can put together an accurate quote."
      />

      <section className="pb-16 sm:pb-20">
        <Container size="narrow">
          <LeadCaptureForm />
        </Container>
      </section>
    </>
  );
}
