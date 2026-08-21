import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SERVICES } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Website Development & Digital Marketing Services",
  description:
    "Website Development & Digital Marketing Services | Elicpesoftware provides professional website development, WordPress, e-commerce, SEO and digital marketing solutions to help businesses grow online.",
  alternates: { canonical: "/services" },
};

const PROCESS_STEPS = ["Understand", "Strategize", "Build", "Launch", "Optimize"];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Website Development & Digital Marketing Services"
        description="From building your website to growing your online presence, Elicpesoftware provides digital solutions designed to help businesses attract customers and achieve measurable growth."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="space-y-6">
            {SERVICES.map((service, i) => (
              <ScrollReveal key={service.id} delayMs={i * 30}>
                <div id={service.id} className="pub-card scroll-mt-24 rounded-2xl p-6 sm:p-10">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                    <div className="flex shrink-0 items-center gap-4 sm:w-56">
                      <span className="font-jakarta text-3xl font-bold text-crimson/20">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-crimson-light">
                        <service.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-charcoal-dark sm:text-2xl">{service.name}</h2>
                      <p className="mt-1.5 max-w-xl text-sm text-charcoal-muted">{service.description}</p>

                      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {service.includes.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-charcoal">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-20">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark">Our Approach</h2>
          </ScrollReveal>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-2">
            {PROCESS_STEPS.map((step, i) => (
              <ScrollReveal key={step} delayMs={i * 60} className="flex items-center gap-2 sm:gap-3">
                <span className="rounded-full border border-hairline bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-dark">
                  {step}
                </span>
                {i < PROCESS_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-crimson/50" aria-hidden="true" />
                )}
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Have a Digital Project in Mind?"
        description="Tell us what you want to achieve and let's create the right digital solution for your business."
        buttonLabel="Get a Free Consultation"
      />
    </>
  );
}
