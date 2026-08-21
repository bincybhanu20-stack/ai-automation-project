"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { FormField } from "@/components/ui/FormField";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { post, loading, error } = usePostJson<{ message: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    const result = await post("/api/auth/reset-password", { token, password });
    if (result) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  if (done) {
    return <Alert variant="success">Password updated. Redirecting you to log in…</Alert>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {(error || localError) && <Alert variant="error">{localError || error}</Alert>}

      <FormField
        id="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />

      <FormField
        id="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your new password"
      />

      <Button type="submit" isLoading={loading} className="w-full">
        Update password
      </Button>

      <Link href="/login" className="block text-center text-sm text-sky-400 hover:text-sky-300">
        Back to login
      </Link>
    </form>
  );
}
