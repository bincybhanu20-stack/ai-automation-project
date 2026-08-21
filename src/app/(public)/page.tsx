import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Target,
  Cpu,
  MousePointerClick,
  Search,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PublicButton } from "@/components/marketing/ui/Button";
import { HeroVisual } from "@/components/marketing/HeroVisual";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { PlatformsShowcase } from "@/components/marketing/PlatformsShowcase";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CaseStudyCard } from "@/components/marketing/CaseStudyCard";
import { CTASection } from "@/components/marketing/CTASection";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { SERVICES } from "@/lib/content/services";
import { CASE_STUDIES } from "@/lib/content/caseStudies";

export const metadata: Metadata = {
  title: { absolute: "Elicpesoftware | Website Development & Digital Marketing Company" },
  description:
    "Elicpesoftware provides professional website development, WordPress, e-commerce, SEO and digital marketing solutions to help businesses grow online.",
  alternates: { canonical: "/" },
};

const HOME_SERVICE_IDS = [
  "website-development",
  "wordpress-development",
  "ecommerce-development",
  "website-redesign",
  "seo",
  "digital-marketing",
];
const HOME_SERVICES = HOME_SERVICE_IDS.map((id) => SERVICES.find((s) => s.id === id)!);

const WEBSITE_HIGHLIGHTS = [
  "Responsive Design",
  "Modern UI/UX",
  "SEO-Friendly Structure",
  "Fast Performance",
  "Secure Development",
  "Conversion Optimization",
  "Mobile Optimization",
];

const MARKETING_INCLUDES = [
  "SEO",
  "Local SEO",
  "Google Ads",
  "PPC",
  "Social Media Marketing",
  "Content Marketing",
  "Lead Generation",
  "Conversion Optimization",
];

const WHY_US = [
  {
    icon: Target,
    title: "Business-Focused Solutions",
    description: "Every website and campaign is built around your actual business goals, not a generic template.",
  },
  {
    icon: Cpu,
    title: "Modern Technology",
    description: "Built with modern, reliable tools and platforms — not outdated frameworks.",
  },
  {
    icon: MousePointerClick,
    title: "Conversion-Focused Design",
    description: "Design decisions are made to turn visitors into leads and customers, not just to look good.",
  },
  {
    icon: Search,
    title: "SEO-Friendly Development",
    description: "Every site is built with clean structure and performance in mind from day one, not bolted on later.",
  },
  {
    icon: ShieldCheck,
    title: "Performance & Security",
    description: "Fast, secure builds that protect your business and your customers' data.",
  },
  {
    icon: LifeBuoy,
    title: "Long-Term Support",
    description: "Ongoing maintenance and support after launch — we don't disappear once the site goes live.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden py-16 sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="pub-fade-up text-center lg:text-left">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-crimson">
                Website Development &amp; Digital Marketing
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-charcoal-dark sm:text-5xl lg:text-6xl">
                We Build Websites.
                <br />
                We Grow Businesses.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg font-medium leading-relaxed text-charcoal-dark lg:mx-0">
                Website Development &amp; Digital Marketing Solutions That Drive Real Business Growth
              </p>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-charcoal lg:mx-0">
                Elicpesoftware helps businesses build powerful websites, strengthen their online presence,
                attract the right audience and generate meaningful business opportunities through website
                development and digital marketing.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <PublicButton href="/request-quote" size="lg" className="w-full sm:w-auto">
                  Get a Free Consultation
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PublicButton>
                <PublicButton href="/services" variant="secondary" size="lg" className="w-full sm:w-auto">
                  Explore Our Services
                </PublicButton>
              </div>
            </div>
            <HeroVisual />
          </div>
        </Container>
      </section>

      {/* Company Introduction */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-20">
        <Container size="narrow" className="text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark">Your Digital Growth Partner</h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal">
              Your website is often the first interaction customers have with your business. We combine
              professional website development, modern design, SEO and digital marketing to create digital
              experiences that help businesses compete and grow online.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-crimson hover:gap-2.5"
            >
              Learn More About Us
              <ArrowRight className="h-4 w-4 transition-all" aria-hidden="true" />
            </Link>
          </ScrollReveal>
        </Container>
      </section>

      {/* Services Preview */}
      <section className="py-16 sm:py-24">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">
              Website Development &amp; Digital Marketing Services
            </h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_SERVICES.map((service, i) => (
              <ScrollReveal key={service.id} delayMs={i * 60}>
                <ServiceCard
                  icon={service.icon}
                  name={service.name}
                  description={service.description}
                  href={`/services#${service.id}`}
                />
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <PublicButton href="/services" variant="secondary">
              View All Services
            </PublicButton>
          </div>
        </Container>
      </section>

      {/* Website Development spotlight */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-24">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <ScrollReveal>
              <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">
                Websites Designed to Turn Visitors Into Customers
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-charcoal">
                We don&apos;t build websites simply to look good. We create fast, responsive and
                user-friendly websites designed around your customers and business objectives.
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-3">
                {WEBSITE_HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-charcoal">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-crimson" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <PublicButton href="/request-quote" className="mt-8">
                Start Your Website Project
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </PublicButton>
            </ScrollReveal>
            <ScrollReveal delayMs={80}>
              <PlatformsShowcase />
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Digital Marketing spotlight */}
      <section className="py-16 sm:py-24">
        <Container size="narrow" className="text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">
              Get Found. Get Noticed. Get More Customers.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-charcoal">
              A great website needs the right audience. Our digital marketing services help businesses
              increase online visibility, reach potential customers and create consistent growth
              opportunities.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {MARKETING_INCLUDES.map((item) => (
                <span key={item} className="rounded-full border border-hairline bg-white px-4 py-2 text-sm font-medium text-charcoal">
                  {item}
                </span>
              ))}
            </div>
            <PublicButton href="/services#digital-marketing" className="mt-8">
              Explore Digital Marketing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </PublicButton>
          </ScrollReveal>
        </Container>
      </section>

      {/* Why Elicpesoftware */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-24">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">
              Why Choose Elicpesoftware?
            </h2>
          </ScrollReveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_US.map((item, i) => (
              <ScrollReveal key={item.title} delayMs={i * 50}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-crimson-light">
                  <item.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-charcoal-dark">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal">{item.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-24">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">
              From Idea to Digital Growth
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <HowItWorks />
          </ScrollReveal>
        </Container>
      </section>

      {/* Portfolio Preview */}
      <section className="border-t border-hairline bg-surface py-16 sm:py-24">
        <Container>
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-charcoal-dark sm:text-4xl">Our Recent Work</h2>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CASE_STUDIES.slice(0, 3).map((study, i) => (
              <ScrollReveal key={study.id} delayMs={i * 60}>
                <CaseStudyCard
                  category={study.category}
                  name={study.name}
                  description={study.description}
                  technology={study.technology}
                  outcomes={study.outcomes}
                  icon={study.icon}
                />
              </ScrollReveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <PublicButton href="/portfolio" variant="secondary">
              View Our Portfolio
            </PublicButton>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <CTASection
        title="Ready to Grow Your Business Online?"
        description="Let's create a website and digital marketing strategy that works for your business."
        buttonLabel="Start Your Project"
        href="/request-quote"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
