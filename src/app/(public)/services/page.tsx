import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";
import { SERVICES } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Web and app development, client management systems, workflow automation, AI-powered lead qualification and ongoing support.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Everything from build to automation"
        description="Pick a starting point below, or tell us what you need and we'll scope it together."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <Card key={service.name} className="h-full">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10">
                  <service.icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">{service.name}</h2>
                <p className="mt-2 text-sm text-slate-400">{service.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Not sure which service fits?"
        description="Describe your project in a couple of sentences — we'll point you in the right direction."
      />
    </>
  );
}
