import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, Workflow, ShieldCheck, LineChart } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ServiceCard } from "@/components/marketing/ServiceCard";
import { CTASection } from "@/components/marketing/CTASection";
import { SERVICES } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Client Management & AI Automation Platform",
  description:
    "Track leads, manage clients and projects, and automate the busywork with n8n and AI-assisted lead qualification — all in one place.",
};

const VALUE_PROPS = [
  {
    icon: Sparkles,
    title: "AI-assisted qualification",
    description: "Every inbound lead is scored and summarized automatically, the moment it arrives.",
  },
  {
    icon: Workflow,
    title: "n8n-powered automation",
    description: "Notifications, reminders and handoffs run themselves — no manual chasing.",
  },
  {
    icon: LineChart,
    title: "One pipeline, start to finish",
    description: "Leads, clients, projects and tasks live in a single system your whole team can see.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access, built in",
    description: "Clients see only their own data. Every action is authorized server-side and audited.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <Container size="narrow" className="text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-sky-400">
            Client Management &amp; AI Automation
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-100 sm:text-6xl">
            Run your client pipeline{" "}
            <span className="gradient-text">on autopilot</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            From first inquiry to finished project — capture leads, qualify them with AI,
            manage clients and projects, and automate the repetitive parts with n8n.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/request-quote"
              className="gradient-button inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white sm:w-auto"
            >
              Request a Quote
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/services"
              className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 sm:w-auto"
            >
              Explore Services
            </Link>
          </div>
        </Container>
      </section>

      {/* What we do */}
      <section className="border-t border-white/5 py-16 sm:py-20">
        <Container>
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-slate-100">What we do</h2>
            <p className="mt-3 text-slate-400">
              Everything you need to turn inquiries into finished projects.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.slice(0, 3).map((service) => (
              <ServiceCard
                key={service.name}
                icon={service.icon}
                name={service.name}
                description={service.summary}
              />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              See all services
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      {/* Why ClientFlow */}
      <section className="border-t border-white/5 py-16 sm:py-20">
        <Container>
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-bold text-slate-100">Why ClientFlow</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((prop) => (
              <div key={prop.title}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10">
                  <prop.icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">{prop.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{prop.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Ready to get started?"
        description="Tell us about your project and we'll get back to you with next steps."
      />
    </>
  );
}
