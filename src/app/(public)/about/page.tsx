import type { Metadata } from "next";
import { Gem, Lightbulb, Eye, Heart, TrendingUp, Code2, Search, Megaphone, MousePointerClick, BarChart3 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export const metadata: Metadata = {
  title: "About Elicpesoftware | Web Development & Digital Marketing",
  description:
    "Elicpesoftware is a website development and digital marketing company focused on helping businesses establish a stronger online presence through modern websites and effective digital strategies.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Gem,
    title: "Quality",
    description: "Deliver professional solutions with attention to detail.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Use modern technologies and digital strategies.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Communicate clearly and work honestly.",
  },
  {
    icon: Heart,
    title: "Customer Focus",
    description: "Build solutions around customer and business needs.",
  },
  {
    icon: TrendingUp,
    title: "Continuous Improvement",
    description: "Continuously analyze, optimize and improve.",
  },
];

const DIAGRAM_NODES = [
  { icon: Code2, label: "Website Development" },
  { icon: Search, label: "SEO" },
  { icon: Megaphone, label: "Digital Marketing" },
  { icon: MousePointerClick, label: "Conversion" },
  { icon: BarChart3, label: "Analytics" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="We Build Digital Experiences That Help Businesses Grow"
        description="Elicpesoftware is a website development and digital marketing company focused on helping businesses establish a stronger online presence through modern websites and effective digital strategies."
      />

      {/* Who We Are */}
      <section className="py-16 sm:py-20">
        <Container size="narrow" className="text-center">
          <ScrollReveal>
            <h2 className="text-2xl font-bold tracking-tight text-charcoal-dark sm:text-3xl">Who We Are</h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal">
              Elicpesoftware combines website development, design, technology and digital marketing to create
              practical digital solutions for businesses.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-charcoal">
              We believe a successful online presence requires more than an attractive website. It requires the
              right technology, user experience, visibility, performance and strategy.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-20">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2">
            <ScrollReveal className="pub-card rounded-2xl p-8">
              <h2 className="text-xl font-bold tracking-tight text-charcoal-dark">Our Mission</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">
                To help businesses use technology and digital marketing to build stronger brands, reach more
                customers and achieve sustainable online growth.
              </p>
            </ScrollReveal>
            <ScrollReveal delayMs={60} className="pub-card rounded-2xl p-8">
              <h2 className="text-xl font-bold tracking-tight text-charcoal-dark">Our Vision</h2>
              <p className="mt-3 text-sm leading-relaxed text-charcoal">
                To become a trusted digital growth partner for businesses looking to build, improve and grow
                their online presence.
              </p>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark">Our Values</h2>
          </ScrollReveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {VALUES.map((value, i) => (
              <ScrollReveal key={value.title} delayMs={i * 50}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-crimson-light">
                  <value.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-charcoal-dark">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal">{value.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* What Makes Us Different */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-20">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark">
              More Than a Website. A Complete Digital Growth Approach.
            </h2>
            <p className="mt-3 text-lg text-charcoal">
              We connect website development, SEO, digital marketing, conversion and analytics — working
              together, not as disconnected services.
            </p>
          </ScrollReveal>

          <ScrollReveal className="pub-card rounded-2xl p-8 sm:p-10">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {DIAGRAM_NODES.map((node, i) => (
                <div key={node.label} className="flex items-center gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-hairline bg-white shadow-sm">
                      <node.icon className="h-6 w-6 text-crimson" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <span className="w-24 text-xs font-medium text-charcoal-dark">{node.label}</span>
                  </div>
                  {i < DIAGRAM_NODES.length - 1 && (
                    <span className="hidden h-px w-8 shrink-0 bg-crimson/30 sm:block" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </ScrollReveal>
        </Container>
      </section>

      <CTASection
        title="Let's Build Something That Moves Your Business Forward"
        description="Tell us about your project and we'll get back to you within one business day."
        buttonLabel="Talk to Our Team"
        href="/contact"
      />
    </>
  );
}
