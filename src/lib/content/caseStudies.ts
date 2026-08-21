import { Globe2, Store, Sparkles, Search, Megaphone } from "lucide-react";

export const PORTFOLIO_FILTERS = [
  "All",
  "Website Development",
  "WordPress",
  "E-commerce",
  "Redesign",
  "Digital Marketing",
] as const;

/**
 * Representative project TYPES, not named client case studies — Elicpesoftware
 * doesn't have public-permission client work to publish here yet. Real
 * projects (with client permission) should replace these before launch. No
 * invented client names, industries or measurable results anywhere in this
 * file — every "outcome" listed describes what was delivered, not a claimed
 * business result.
 */
export const CASE_STUDIES = [
  {
    id: "business-website-launch",
    category: "Website Development",
    name: "Business Website Launch",
    description:
      "A custom-built, responsive business website — designed around the client's services and built for speed, clarity and mobile-first browsing.",
    services: ["Website Development"],
    technology: ["Responsive Design", "Modern UI/UX", "Fast Performance"],
    outcomes: [
      "Fully responsive across desktop, tablet and mobile",
      "SEO-friendly page structure from day one",
      "Built for fast load times, not just visual polish",
    ],
    icon: Globe2,
  },
  {
    id: "wordpress-business-site",
    category: "WordPress",
    name: "WordPress Business Site",
    description:
      "A flexible WordPress build with custom theme work and editor-friendly content sections, so the client's own team can update pages without a developer.",
    services: ["WordPress Development"],
    technology: ["WordPress", "Elementor", "Custom Theme"],
    outcomes: [
      "Editable page sections for non-technical staff",
      "Custom functionality beyond default WordPress themes",
      "Ongoing maintenance and update plan in place",
    ],
    icon: Globe2,
  },
  {
    id: "ecommerce-store-build",
    category: "E-commerce",
    name: "E-commerce Store Build",
    description:
      "A WooCommerce storefront covering product catalog, payment integration and shipping setup, designed around a smooth checkout experience.",
    services: ["E-commerce Development"],
    technology: ["WooCommerce", "Payment Integration", "Shipping Integration"],
    outcomes: [
      "Streamlined product-to-checkout flow",
      "Integrated payment and shipping providers",
      "Built with conversion-focused product pages",
    ],
    icon: Store,
  },
  {
    id: "outdated-site-redesign",
    category: "Redesign",
    name: "Outdated Site Redesign",
    description:
      "A full redesign of an aging, non-responsive website — modern UI, restructured content and a real performance pass, not just a visual refresh.",
    services: ["Website Redesign"],
    technology: ["UI/UX Improvements", "Performance Optimization", "Responsive Design"],
    outcomes: [
      "Replaced a non-responsive layout with a mobile-first one",
      "Reorganized content structure for easier scanning",
      "Measurable page-speed improvements post-launch",
    ],
    icon: Sparkles,
  },
  {
    id: "seo-organic-growth",
    category: "Digital Marketing",
    name: "SEO & Organic Growth",
    description:
      "Technical and on-page SEO work — audits, keyword strategy and content optimization — aimed at improving organic search visibility over time.",
    services: ["SEO", "Digital Marketing"],
    technology: ["Technical SEO", "Keyword Strategy", "Content Optimization"],
    outcomes: [
      "Full technical SEO audit and fix list",
      "On-page optimization across key landing pages",
      "Ongoing performance monitoring, not a one-time fix",
    ],
    icon: Search,
  },
  {
    id: "ppc-campaign-setup",
    category: "Digital Marketing",
    name: "PPC Campaign Setup",
    description:
      "Google Ads campaign setup with keyword research and conversion tracking, built to give a client real visibility into what's working.",
    services: ["Google Ads & PPC"],
    technology: ["Search Ads", "Conversion Tracking", "Campaign Optimization"],
    outcomes: [
      "Structured campaigns by intent, not guesswork",
      "Conversion tracking wired in from launch",
      "Clear reporting on spend versus results",
    ],
    icon: Megaphone,
  },
] as const;
