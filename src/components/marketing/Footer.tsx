import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact", label: "Contact" },
];

const SERVICES_LINKS_A = [
  { href: "/services#website-development", label: "Website Development" },
  { href: "/services#wordpress-development", label: "WordPress Development" },
  { href: "/services#ecommerce-development", label: "E-commerce" },
  { href: "/services#website-redesign", label: "Website Redesign" },
  { href: "/services#seo", label: "SEO" },
];

const SERVICES_LINKS_B = [
  { href: "/services#digital-marketing", label: "Digital Marketing" },
  { href: "/services#google-ads-ppc", label: "Google Ads" },
  { href: "/services#social-media-marketing", label: "Social Media Marketing" },
  { href: "/services#website-maintenance", label: "Website Maintenance" },
];

const RESOURCES_LINKS = [
  { href: "/request-quote", label: "Get a Free Consultation" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-charcoal hover:text-crimson">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-surface">
      <Container size="wide">
        <div className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal">
              Website Development &amp; Digital Marketing Company helping businesses build, promote and
              grow their online presence.
            </p>
          </div>

          <FooterColumn title="Quick Links" links={QUICK_LINKS} />
          <FooterColumn title="Services" links={SERVICES_LINKS_A} />
          <FooterColumn title="More Services" links={SERVICES_LINKS_B} />
          <FooterColumn title="Resources" links={RESOURCES_LINKS} />
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-hairline py-6 sm:flex-row">
          <p className="text-xs text-charcoal-muted">© {year} Elicpesoftware. All rights reserved.</p>
          <a
            href="/contact"
            className="flex items-center gap-1.5 text-xs text-charcoal-muted hover:text-crimson"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            Get in touch
          </a>
        </div>
      </Container>
    </footer>
  );
}
