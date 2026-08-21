"use client";

import { useState } from "react";

/**
 * Shared fetch-POST-JSON logic for the auth forms (login, forgot password,
 * reset password). Centralizes loading/error state so every form gets the
 * same behavior: disable the button while submitting, show a clear message
 * on failure, never leave the user staring at a frozen screen.
 */
export function usePostJson<TResponse = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Field-level errors, e.g. { email: "Enter a valid email address" }.
  // Most callers (login, forgot-password) never set this — only forms with
  // per-field server validation (the lead capture form) read it.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function post(url: string, body: unknown): Promise<TResponse | null> {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const responseBody = data as { error?: string; fieldErrors?: Record<string, string> };
        setError(responseBody.error || "Something went wrong. Please try again.");
        if (responseBody.fieldErrors) setFieldErrors(responseBody.fieldErrors);
        return null;
      }
      return data as TResponse;
    } catch {
      setError("Network error. Please check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { post, loading, error, setError, fieldErrors };
}
