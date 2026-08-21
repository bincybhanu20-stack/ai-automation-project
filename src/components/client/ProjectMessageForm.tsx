"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitProjectMessageAction } from "@/lib/actions/client";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

export function ProjectMessageForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(submitProjectMessageAction);
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(projectId, { body });
    if (result?.success) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <TextareaField
        id="messageBody"
        label="Send a message or request"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Ask a question or request a change…"
      />
      {fieldErrors.body && <p className="text-xs text-red-600">{fieldErrors.body}</p>}
      <Button type="submit" isLoading={isPending} size="sm" disabled={!body.trim()}>
        Send
      </Button>
    </form>
  );
}
