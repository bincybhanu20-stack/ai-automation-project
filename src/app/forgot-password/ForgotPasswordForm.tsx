"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const { post, loading, error } = usePostJson<{ message: string }>();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await post("/api/auth/forgot-password", { email });
    if (result) setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          If an account exists for that email, a password reset link has been sent. In
          development, check the server console for the link.
        </Alert>
        <Link href="/login" className="text-sm text-sky-400 hover:text-sky-300">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <Button type="submit" isLoading={loading} className="w-full">
        Send reset link
      </Button>

      <Link href="/login" className="block text-center text-sm text-sky-400 hover:text-sky-300">
        Back to login
      </Link>
    </form>
  );
}
