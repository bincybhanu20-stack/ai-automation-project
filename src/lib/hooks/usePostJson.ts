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

  async function post(url: string, body: unknown): Promise<TResponse | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || "Something went wrong. Please try again.");
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

  return { post, loading, error, setError };
}
