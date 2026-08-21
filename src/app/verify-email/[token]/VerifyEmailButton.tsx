"use client";

import { useState } from "react";
import Link from "next/link";
import { usePostJson } from "@/lib/hooks/usePostJson";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function VerifyEmailButton({ token }: { token: string }) {
  const { post, loading, error } = usePostJson<{ message: string }>();
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    const result = await post("/api/auth/verify-email", { token });
    if (result) setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert variant="success">Your email address has been verified.</Alert>
        <Link href="/login" className="text-sm text-sky-400 hover:text-sky-300">
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <p className="text-sm text-slate-400">
        Click below to confirm this is your email address.
      </p>
      <Button onClick={handleConfirm} isLoading={loading} className="w-full">
        Verify my email
      </Button>
    </div>
  );
}
