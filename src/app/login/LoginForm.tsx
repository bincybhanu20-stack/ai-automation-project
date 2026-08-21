"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/** Only allow redirecting back to a path on THIS site — never an external
 * URL. Without this check, ?redirectTo=https://evil.example.com would let
 * an attacker send a freshly-logged-in user straight to a phishing page. */
function safeRedirect(path: string | null): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { post, loading, error } = usePostJson<{ redirectTo: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await post("/api/auth/login", { email, password });
    if (result) {
      const target = safeRedirect(searchParams.get("redirectTo")) || result.redirectTo;
      router.push(target);
      router.refresh(); // re-run server components so they see the new session
    }
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

      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-sky-400 hover:text-sky-300">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" isLoading={loading} className="w-full">
        Log in
      </Button>
    </form>
  );
}
