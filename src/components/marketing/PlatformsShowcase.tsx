import { Globe, ShoppingBag, LayoutTemplate, Palette, Building2, Puzzle } from "lucide-react";
import { PublicCard } from "./ui/Card";

const PLATFORMS = [
  {
    icon: Globe,
    name: "WordPress",
    description: "The world's most widely used CMS, extended and customized to your needs.",
  },
  {
    icon: ShoppingBag,
    name: "Shopify",
    description: "E-commerce storefronts built for speed and conversions.",
  },
  {
    icon: LayoutTemplate,
    name: "Webflow",
    description: "Visual, CMS-driven websites you can update without touching code.",
  },
  {
    icon: Palette,
    name: "Wix",
    description: "Fast, accessible website builds for smaller teams and budgets.",
  },
  {
    icon: Building2,
    name: "Drupal",
    description: "Structured, enterprise-grade content management for complex sites.",
  },
  {
    icon: Puzzle,
    name: "Joomla",
    description: "A flexible open-source CMS for content-driven websites.",
  },
] as const;

/** Web development tools & CMS platforms we build on — shown alongside the
 * homepage's "Website Development" spotlight, in a half-width column, so
 * this grid is deliberately narrower than a full-width one would be. */
export function PlatformsShowcase() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLATFORMS.map((platform) => (
        <PublicCard key={platform.name} className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-crimson-light">
            <platform.icon className="h-5 w-5 text-crimson" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-charcoal-dark">{platform.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-charcoal">{platform.description}</p>
          </div>
        </PublicCard>
      ))}
    </div>
  );
}
