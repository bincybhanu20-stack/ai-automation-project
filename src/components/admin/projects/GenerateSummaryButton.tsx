"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { generateProjectSummaryAction, getProjectAiSummaryStatusAction } from "@/lib/actions/admin-projects";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 90000;

type Phase = "idle" | "triggering" | "waiting" | "done" | "error" | "timeout";

interface GenerateSummaryButtonProps {
  projectId: string;
  hasSummary: boolean;
  initialGeneratedAt: string | null;
}

/**
 * The real, app-side trigger for WF-010 (previously only runnable by
 * manually executing the workflow inside n8n). WF-010's webhook acks
 * immediately, then runs asynchronously and writes the result back via
 * POST /api/n8n/projects/:id/summary — so "success" here only means "n8n
 * started the job," not "the summary is ready." This component polls for
 * that completion and refreshes the page itself once it lands.
 */
export function GenerateSummaryButton({ projectId, hasSummary, initialGeneratedAt }: GenerateSummaryButtonProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const baselineRef = useRef(initialGeneratedAt);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    };
  }, []);

  function stopPolling() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (timeoutTimer.current) {
      clearTimeout(timeoutTimer.current);
      timeoutTimer.current = null;
    }
  }

  async function handleClick() {
    if (phase === "triggering" || phase === "waiting") return; // guards accidental double-click
    setError(null);
    setPhase("triggering");

    const result = await generateProjectSummaryAction(projectId);
    if (!result?.success) {
      setError(result?.error || "Something went wrong. Please try again.");
      setPhase("error");
      return;
    }

    setPhase("waiting");
    pollTimer.current = setInterval(async () => {
      const status = await getProjectAiSummaryStatusAction(projectId).catch(() => null);
      if (status?.aiSummaryGeneratedAt && status.aiSummaryGeneratedAt !== baselineRef.current) {
        stopPolling();
        baselineRef.current = status.aiSummaryGeneratedAt;
        setPhase("done");
        router.refresh();
      }
    }, POLL_INTERVAL_MS);

    timeoutTimer.current = setTimeout(() => {
      stopPolling();
      setPhase((p) => (p === "waiting" ? "timeout" : p));
    }, POLL_TIMEOUT_MS);
  }

  const isBusy = phase === "triggering" || phase === "waiting";

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} variant="secondary" size="sm" disabled={isBusy} isLoading={isBusy}>
        {!isBusy && <Sparkles className="h-4 w-4" aria-hidden="true" />}
        {phase === "triggering"
          ? "Starting…"
          : phase === "waiting"
            ? "Generating…"
            : hasSummary
              ? "Regenerate AI Summary"
              : "Generate AI Summary"}
      </Button>
      {phase === "waiting" && (
        <p className="text-xs text-charcoal-muted">
          This can take up to a minute. You can leave this page — the summary will be here when you come back.
        </p>
      )}
      {phase === "timeout" && (
        <Alert variant="success">
          Still working on it. Refresh this page in a bit to check for the result.
        </Alert>
      )}
      {phase === "error" && error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
