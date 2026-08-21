"use client";

import { useState, useTransition } from "react";

interface ActionResultShape {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * The Server Action equivalent of usePostJson (src/lib/hooks/usePostJson.ts)
 * — same idea (centralized loading/error state so every action button
 * behaves consistently), adapted for calling a 'use server' function
 * directly instead of fetch(). useTransition's isPending is what drives the
 * loading state.
 */
export function useServerAction<TArgs extends unknown[], TResult extends ActionResultShape>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function run(...args: TArgs): Promise<TResult | undefined> {
    return new Promise((resolve) => {
      setError(null);
      setFieldErrors({});
      startTransition(() => {
        action(...args)
          .then((result) => {
            if (!result.success) {
              setError(result.error || "Something went wrong.");
              if (result.fieldErrors) setFieldErrors(result.fieldErrors);
            }
            resolve(result);
          })
          .catch(() => {
            setError("Something went wrong. Please try again.");
            resolve(undefined);
          });
      });
    });
  }

  return { run, isPending, error, fieldErrors, setError };
}
