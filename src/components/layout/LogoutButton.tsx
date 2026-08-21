"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await res.json().catch(() => ({ redirectTo: "/login" }));
      router.push(data.redirectTo || "/login");
      router.refresh(); // clear any cached server-rendered session data
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleLogout} isLoading={loading}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Log out
    </Button>
  );
}
