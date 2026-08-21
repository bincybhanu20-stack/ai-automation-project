"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLeadNoteAction } from "@/lib/actions/admin-leads";
import { useServerAction } from "@/lib/hooks/useServerAction";
import { TextareaField } from "@/components/admin/ui/Textarea";
import { Button } from "@/components/admin/ui/Button";
import { Alert } from "@/components/admin/ui/Alert";

export function AddNoteForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const { run, isPending, error, fieldErrors } = useServerAction(addLeadNoteAction);
  const [body, setBody] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await run(leadId, { body });
    if (result?.success) {
      setBody("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && <Alert variant="error">{error}</Alert>}
      <TextareaField
        id="noteBody"
        label="Add a note"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Internal note about this lead…"
      />
      {fieldErrors.body && <p className="text-xs text-red-600">{fieldErrors.body}</p>}
      <Button type="submit" isLoading={isPending} size="sm" disabled={!body.trim()}>
        Add note
      </Button>
    </form>
  );
}
