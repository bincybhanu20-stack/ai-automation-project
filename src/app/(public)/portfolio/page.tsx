import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { PageHero } from "@/components/marketing/PageHero";
import { CTASection } from "@/components/marketing/CTASection";
import { Boxes, Workflow, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Representative examples of the kind of systems we build.",
};

// Representative project types, not named client case studies — this is a
// new platform without a public portfolio yet. Real case studies (with
// permission from actual clients) should replace these before launch.
const PROJECT_TYPES = [
  {
    icon: Boxes,
    category: "Client Management System",
    title: "Lead-to-project pipeline for a services business",
    description:
      "Replaced a spreadsheet-based lead tracker with a full pipeline: public intake form, qualification, conversion to client, project and task tracking, and a client-facing portal.",
    outcomes: ["Single source of truth for every lead and client", "Role-based access for staff and clients", "Full audit trail on every status change"],
  },
  {
    icon: Workflow,
    category: "Workflow Automation",
    title: "n8n automation for deadline and status notifications",
    description:
      "Built automated workflows that watch for approaching task deadlines, overdue items and status changes, notifying the right person without any manual checking.",
    outcomes: ["Automatic overdue-task escalation", "Notifications tied to real database events", "Execution history logged for every run"],
  },
  {
    icon: Bot,
    category: "AI Integration",
    title: "Automated lead scoring on inbound inquiries",
    description:
      "Every inbound lead is analyzed on submission — scored, summarized, and given a suggested next status — so the team can prioritize follow-up instead of triaging manually.",
    outcomes: ["Consistent scoring criteria across every lead", "Human review before any high-impact action", "Works with or without a configured AI provider"],
  },
];

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        eyebrow="Portfolio"
        title="The kind of systems we build"
        description="ClientFlow is a newer platform, so rather than name-drop clients we can't yet showcase publicly, here's the type of work we do — including the platform you're looking at right now."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {PROJECT_TYPES.map((project) => (
              <Card key={project.title} className="flex h-full flex-col">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10">
                  <project.icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  {project.category}
                </p>
                <h2 className="mt-2 text-base font-semibold text-slate-100">{project.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{project.description}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-slate-400">
                  {project.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2">
                      <span className="text-sky-400" aria-hidden="true">
                        •
                      </span>
                      {outcome}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <CTASection
        title="Have a similar project in mind?"
        description="Tell us what you're working on and we'll tell you honestly whether we're a good fit."
      />
    </>
  );
}
