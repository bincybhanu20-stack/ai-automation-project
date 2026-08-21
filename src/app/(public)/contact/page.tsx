import type { Metadata } from "next";
import { Mail, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/marketing/PageHero";
import { LeadCaptureForm } from "@/components/leads/LeadCaptureForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch — tell us about your project and we'll respond within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your project"
        description="Fill out the form below and we'll get back to you within one business day."
      />

      <section className="py-16 sm:py-20">
        <Container size="default">
          <div className="grid gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Email</p>
                    <p className="text-sm text-slate-400">hello@clientflow.example</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Response time</p>
                    <p className="text-sm text-slate-400">Within one business day</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <LeadCaptureForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
