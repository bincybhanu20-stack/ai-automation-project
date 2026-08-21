import { z } from "zod";

function sanitizeText(value: unknown): unknown {
  if (typeof value !== "string") return value;
  // eslint-disable-next-line no-control-regex -- intentionally stripping control chars
  return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export const submitProjectMessageSchema = z.object({
  body: z.preprocess(
    sanitizeText,
    z.string().min(1, "Message can't be empty").max(2000, "Message is too long")
  ),
});
export type SubmitProjectMessageInput = z.infer<typeof submitProjectMessageSchema>;
