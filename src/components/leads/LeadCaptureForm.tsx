"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { PublicField } from "@/components/marketing/ui/Field";
import { PublicTextarea } from "@/components/marketing/ui/Textarea";
import { PublicSelect } from "@/components/marketing/ui/Select";
import { PublicAlert } from "@/components/marketing/ui/Alert";
import { PublicCard } from "@/components/marketing/ui/Card";
import { PublicButton } from "@/components/marketing/ui/Button";
import { SERVICE_OPTIONS, BUDGET_OPTIONS } from "@/lib/validations/leads";

interface LeadFormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  budget: string;
  projectDescription: string;
  website: string; // honeypot — never shown, never filled by real users
}

const EMPTY_FORM: LeadFormState = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  budget: "",
  projectDescription: "",
  website: "",
};

interface LeadCaptureFormProps {
  /** "quote" shows the full field set (adds Budget). "contact" is the
   * lighter version used on the Contact page — same underlying
   * projectDescription field, just labeled "Message". */
  variant?: "contact" | "quote";
}

export function LeadCaptureForm({ variant = "quote" }: LeadCaptureFormProps) {
  const { post, loading, error, fieldErrors } = usePostJson<{ success: boolean; message: string }>();
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState<string | null>(null);

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await post("/api/leads", form);
    if (result?.success) {
      setSubmitted(result.message);
      setForm(EMPTY_FORM);
    }
  }

  if (submitted) {
    return (
      <PublicCard className="text-center">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-crimson" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-charcoal-dark">Request received</h3>
        <p className="mt-2 text-sm text-charcoal">{submitted}</p>
        <PublicButton variant="secondary" className="mt-6" onClick={() => setSubmitted(null)}>
          Submit another request
        </PublicButton>
      </PublicCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pub-card space-y-5 rounded-2xl p-6 sm:p-8" noValidate>
      {error && <PublicAlert variant="error">{error}</PublicAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <PublicField
          id="name"
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jordan Blake"
        />
        {fieldErrors.name && <p className="-mt-4 text-xs text-crimson sm:col-start-1">{fieldErrors.name}</p>}

        <PublicField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@company.com"
        />
        {fieldErrors.email && <p className="-mt-4 text-xs text-crimson">{fieldErrors.email}</p>}

        <PublicField
          id="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 555 123 4567"
        />
        {fieldErrors.phone && <p className="-mt-4 text-xs text-crimson">{fieldErrors.phone}</p>}

        <PublicField
          id="company"
          label="Company (optional)"
          autoComplete="organization"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Acme Robotics"
        />
        {fieldErrors.company && <p className="-mt-4 text-xs text-crimson">{fieldErrors.company}</p>}

        <PublicSelect
          id="service"
          label="Service you're interested in"
          options={SERVICE_OPTIONS}
          value={form.service}
          onChange={(e) => update("service", e.target.value)}
        />

        {variant === "quote" && (
          <PublicSelect
            id="budget"
            label="Estimated budget"
            options={BUDGET_OPTIONS}
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
          />
        )}
      </div>

      <div>
        <PublicTextarea
          id="projectDescription"
          label={variant === "quote" ? "Tell us about your project" : "Message"}
          required
          rows={5}
          minLength={20}
          value={form.projectDescription}
          onChange={(e) => update("projectDescription", e.target.value)}
          placeholder="What are you trying to build, and what's the timeline?"
        />
        {fieldErrors.projectDescription && (
          <p className="mt-1.5 text-xs text-crimson">{fieldErrors.projectDescription}</p>
        )}
      </div>

      {/* Honeypot — hidden from real visitors via CSS and taken out of tab
          order and screen-reader flow. A filled value means a bot filled
          the form programmatically, since no sighted user can see this
          field to fill it in. See src/lib/validations/leads.ts. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
        />
      </div>

      <PublicButton type="submit" isLoading={loading} className="w-full sm:w-auto">
        {variant === "quote" ? "Start a Project" : "Submit"}
      </PublicButton>
      <p className="text-xs text-charcoal-muted">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="underline hover:text-charcoal">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
