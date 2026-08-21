import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PublicAlert } from "@/components/marketing/ui/Alert";
import { PageHero } from "@/components/marketing/PageHero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Elicpesoftware.",
  alternates: { canonical: "/terms" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline py-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-charcoal-dark">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-charcoal">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />

      <section className="pb-16 sm:pb-20">
        <Container size="narrow">
          <PublicAlert variant="error">
            This is a template, not legal advice. Have a qualified lawyer review and
            customize this page — including the governing-law and liability sections —
            before relying on it in production.
          </PublicAlert>

          <p className="mt-8 text-xs text-charcoal-muted">Last updated: 21 August 2026</p>

          <div className="mt-4">
            <Section title="1. Acceptance of terms">
              <p>
                By accessing or using this website, submitting a form, or using the
                client portal, you agree to be bound by these Terms of Service. If you
                do not agree, please do not use this site.
              </p>
            </Section>

            <Section title="2. Description of service">
              <p>
                We provide client management, project tracking and related automation
                services. Features and availability may change over time without
                prior notice.
              </p>
            </Section>

            <Section title="3. Accounts">
              <p>
                Client portal accounts are provisioned by us. You are responsible for
                maintaining the confidentiality of your login credentials and for all
                activity that occurs under your account. Notify us immediately of any
                unauthorized use.
              </p>
            </Section>

            <Section title="4. Acceptable use">
              <p>You agree not to:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>Submit false, misleading or fraudulent information through our forms</li>
                <li>Attempt to gain unauthorized access to any account or system</li>
                <li>Use automated tools to submit excessive or abusive requests</li>
                <li>Interfere with or disrupt the operation of the service</li>
              </ul>
            </Section>

            <Section title="5. Intellectual property">
              <p>
                All content on this site, excluding information you submit to us, is
                the property of its respective owners and may not be reproduced
                without permission.
              </p>
            </Section>

            <Section title="6. Limitation of liability">
              <p>
                The service is provided &quot;as is&quot; without warranties of any
                kind. To the fullest extent permitted by law, we are not liable for
                any indirect, incidental or consequential damages arising from your
                use of the service.
              </p>
            </Section>

            <Section title="7. Changes to these terms">
              <p>
                We may update these terms from time to time. Continued use of the
                service after changes take effect constitutes acceptance of the
                updated terms.
              </p>
            </Section>

            <Section title="8. Governing law">
              <p>
                [Insert your jurisdiction here.] These terms are governed by the laws
                of that jurisdiction, without regard to its conflict-of-law provisions.
              </p>
            </Section>

            <Section title="9. Contact">
              <p>
                Questions about these terms can be sent via our{" "}
                <a href="/contact" className="text-crimson hover:text-crimson-hover">
                  Contact page
                </a>
                .
              </p>
            </Section>
          </div>
        </Container>
      </section>
    </>
  );
}
