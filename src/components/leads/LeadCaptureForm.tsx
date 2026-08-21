"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { FormField } from "@/components/ui/FormField";
import { TextareaField } from "@/components/ui/Textarea";
import { SelectField } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
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

export function LeadCaptureForm() {
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
      <div className="glass-card rounded-xl p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-slate-100">Request received</h3>
        <p className="mt-2 text-sm text-slate-400">{submitted}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setSubmitted(null)}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-5 rounded-xl p-6 sm:p-8" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="name"
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jordan Blake"
        />
        {fieldErrors.name && <p className="-mt-4 text-xs text-red-400 sm:col-start-1">{fieldErrors.name}</p>}

        <FormField
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@company.com"
        />
        {fieldErrors.email && <p className="-mt-4 text-xs text-red-400">{fieldErrors.email}</p>}

        <FormField
          id="phone"
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+1 555 123 4567"
        />
        {fieldErrors.phone && <p className="-mt-4 text-xs text-red-400">{fieldErrors.phone}</p>}

        <FormField
          id="company"
          label="Company (optional)"
          autoComplete="organization"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
          placeholder="Acme Robotics"
        />
        {fieldErrors.company && <p className="-mt-4 text-xs text-red-400">{fieldErrors.company}</p>}

        <SelectField
          id="service"
          label="Service you're interested in"
          options={SERVICE_OPTIONS}
          value={form.service}
          onChange={(e) => update("service", e.target.value)}
        />

        <SelectField
          id="budget"
          label="Estimated budget"
          options={BUDGET_OPTIONS}
          value={form.budget}
          onChange={(e) => update("budget", e.target.value)}
        />
      </div>

      <div>
        <TextareaField
          id="projectDescription"
          label="Tell us about your project"
          required
          rows={5}
          minLength={20}
          value={form.projectDescription}
          onChange={(e) => update("projectDescription", e.target.value)}
          placeholder="What are you trying to build, and what's the timeline?"
        />
        {fieldErrors.projectDescription && (
          <p className="mt-1.5 text-xs text-red-400">{fieldErrors.projectDescription}</p>
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

      <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
        Submit request
      </Button>
      <p className="text-xs text-slate-500">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="underline hover:text-slate-300">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
