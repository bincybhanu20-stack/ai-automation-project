import { Code2, Users2, Workflow, Sparkles, LifeBuoy, HelpCircle } from "lucide-react";
import { SERVICE_OPTIONS } from "@/lib/validations/leads";

/**
 * Display content for each service, keyed to the SAME string values used by
 * SERVICE_OPTIONS (src/lib/validations/leads.ts) — the lead form's dropdown
 * and this marketing copy can never drift apart into different service
 * names, because both read from that one list.
 */
export const SERVICES = [
  {
    name: SERVICE_OPTIONS[0], // "Web & App Development"
    icon: Code2,
    summary: "Fast, responsive web and application interfaces built on modern frameworks.",
    description:
      "From marketing sites to full internal tools, we design and build interfaces that are fast, accessible, and easy for your team to maintain.",
  },
  {
    name: SERVICE_OPTIONS[1], // "Client Management Systems"
    icon: Users2,
    summary: "Purpose-built CRMs that track leads, clients, projects and tasks in one place.",
    description:
      "Replace scattered spreadsheets with a single system: lead pipeline, client records, project tracking and role-based access for your whole team.",
  },
  {
    name: SERVICE_OPTIONS[2], // "Workflow Automation (n8n)"
    icon: Workflow,
    summary: "Automated notifications, reminders and handoffs so nothing slips through.",
    description:
      "We design n8n workflows that react to real events in your system — new leads, approaching deadlines, status changes — and handle the busywork automatically.",
  },
  {
    name: SERVICE_OPTIONS[3], // "AI-Powered Lead Qualification"
    icon: Sparkles,
    summary: "Automatically score and summarize inbound leads as they arrive.",
    description:
      "Every inquiry is analyzed for intent and fit the moment it's submitted, so your team spends time on the conversations most likely to convert.",
  },
  {
    name: SERVICE_OPTIONS[4], // "Ongoing Support & Maintenance"
    icon: LifeBuoy,
    summary: "Continued monitoring, updates and improvements after launch.",
    description:
      "Software needs upkeep. We handle dependency updates, monitoring and incremental improvements so your system stays reliable long after launch day.",
  },
  {
    name: SERVICE_OPTIONS[5], // "Other"
    icon: HelpCircle,
    summary: "Have something else in mind? Tell us about it.",
    description:
      "Every business is different. If your project doesn't fit neatly into the categories above, describe it in the form and we'll get back to you.",
  },
] as const;
