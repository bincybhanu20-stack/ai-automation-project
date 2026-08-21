import {
  MonitorSmartphone,
  Globe,
  ShoppingCart,
  RefreshCw,
  Search,
  Megaphone,
  Target,
  Share2,
  Wrench,
} from "lucide-react";

/**
 * Single source of truth for Elicpesoftware's services — used by the
 * homepage service preview cards and the /services page's detailed
 * sections. Each `id` doubles as the anchor used by footer links
 * (e.g. /services#website-development).
 */
export const SERVICES = [
  {
    id: "website-development",
    name: "Website Development",
    icon: MonitorSmartphone,
    description: "Build professional, responsive and high-performing business websites.",
    includes: ["Business Websites", "Corporate Websites", "Custom Websites", "Responsive Development", "CMS Development"],
  },
  {
    id: "wordpress-development",
    name: "WordPress Development",
    icon: Globe,
    description: "Create flexible WordPress websites tailored to business requirements.",
    includes: ["Custom WordPress Development", "Theme Customization", "Plugin Development", "Elementor", "API Integrations", "WordPress Maintenance"],
  },
  {
    id: "ecommerce-development",
    name: "E-commerce Development",
    icon: ShoppingCart,
    description: "Build user-friendly online stores.",
    includes: ["WooCommerce", "Product Management", "Payment Integration", "Shipping Integration", "E-commerce Optimization", "Conversion Optimization"],
  },
  {
    id: "website-redesign",
    name: "Website Redesign",
    icon: RefreshCw,
    description: "Modernize existing websites.",
    includes: ["UI/UX Improvements", "Responsive Design", "Performance Optimization", "Conversion Optimization", "Content Structure", "Technical Improvements"],
  },
  {
    id: "seo",
    name: "SEO",
    icon: Search,
    description: "Improve search visibility and organic growth.",
    includes: ["Technical SEO", "On-Page SEO", "Local SEO", "Keyword Strategy", "Content Optimization", "SEO Audits", "Performance Monitoring"],
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    icon: Megaphone,
    description: "Create strategies that connect businesses with their target audience.",
    includes: ["Digital Strategy", "Lead Generation", "Content Marketing", "Campaign Management", "Conversion Optimization", "Analytics"],
  },
  {
    id: "google-ads-ppc",
    name: "Google Ads & PPC",
    icon: Target,
    description: "Drive targeted traffic through paid advertising.",
    includes: ["Search Ads", "Display Ads", "Campaign Setup", "Keyword Research", "Conversion Tracking", "Campaign Optimization"],
  },
  {
    id: "social-media-marketing",
    name: "Social Media Marketing",
    icon: Share2,
    description: "Build stronger online brand visibility.",
    includes: ["Social Media Strategy", "Content Planning", "Campaigns", "Audience Engagement", "Performance Analysis"],
  },
  {
    id: "website-maintenance",
    name: "Website Maintenance",
    icon: Wrench,
    description: "Keep websites secure, updated and performing well.",
    includes: ["Updates", "Security", "Backups", "Bug Fixes", "Performance Optimization", "Content Updates"],
  },
] as const;

export function getServiceById(id: string) {
  return SERVICES.find((s) => s.id === id);
}
