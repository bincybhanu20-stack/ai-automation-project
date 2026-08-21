import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Alert } from "@/components/ui/Alert";
import { PageHero } from "@/components/marketing/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ClientFlow collects, uses and protects your information.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/5 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />

      <section className="pb-16 sm:pb-20">
        <Container size="narrow">
          <Alert variant="error">
            This is a template, not legal advice. Have a qualified lawyer review and
            customize this page — including the retention periods, third-party services
            and contact details below — before relying on it in production.
          </Alert>

          <p className="mt-8 text-xs text-slate-500">Last updated: 21 August 2026</p>

          <div className="mt-4">
            <Section title="1. Information we collect">
              <p>
                When you submit a form on this site (such as the contact or quote
                request form), we collect the information you provide: your name,
                email address, phone number, company name, the service you&apos;re
                interested in, your estimated budget, and your project description.
              </p>
              <p>
                We also automatically log your IP address and submission timestamp for
                security and spam-prevention purposes.
              </p>
            </Section>

            <Section title="2. How we use your information">
              <p>
                We use the information you submit to respond to your inquiry, evaluate
                project fit, and — where you create an account — to provide the client
                portal and manage your projects.
              </p>
              <p>
                Inquiry messages may be analyzed, in part automatically, to help
                prioritize and route new leads. Automated analysis is used to assist
                our team, not to make final decisions about you without human review.
              </p>
            </Section>

            <Section title="3. Third-party services">
              <p>We use the following categories of third-party services:</p>
              <ul className="ml-4 list-disc space-y-1.5">
                <li>
                  <span className="text-slate-300">Automation (n8n):</span> submitted
                  lead data may trigger internal workflow notifications.
                </li>
                <li>
                  <span className="text-slate-300">AI providers:</span> if configured,
                  lead messages may be sent to an AI provider for automated
                  qualification. No AI provider is contacted with your information
                  unless our system is configured to do so.
                </li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
            </Section>

            <Section title="4. Cookies">
              <p>
                We use a single, strictly necessary session cookie to keep you logged
                in after authentication. It is not used for advertising or
                cross-site tracking, and we do not currently use third-party analytics
                or advertising cookies.
              </p>
            </Section>

            <Section title="5. Data retention">
              <p>
                We retain lead and client information for as long as reasonably
                necessary to provide our services and comply with legal obligations.
                You may request deletion of your information at any time (see
                &quot;Your rights&quot; below).
              </p>
            </Section>

            <Section title="6. Your rights">
              <p>
                Depending on your location, you may have the right to access, correct,
                export or request deletion of your personal information. To exercise
                these rights, contact us using the details on our{" "}
                <a href="/contact" className="text-sky-400 hover:text-sky-300">
                  Contact page
                </a>
                .
              </p>
            </Section>

            <Section title="7. Security">
              <p>
                We apply reasonable technical safeguards to protect your information,
                including encrypted connections, hashed credentials, and server-side
                authorization checks on every request. No method of transmission or
                storage is perfectly secure, and we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="8. Changes to this policy">
              <p>
                We may update this policy from time to time. Material changes will be
                reflected by updating the &quot;Last updated&quot; date above.
              </p>
            </Section>

            <Section title="9. Contact">
              <p>
                Questions about this policy can be sent via our{" "}
                <a href="/contact" className="text-sky-400 hover:text-sky-300">
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
