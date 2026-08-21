import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { checkVerificationToken } from "@/lib/tokens";
import { VerifyEmailButton } from "./VerifyEmailButton";

export const metadata: Metadata = { title: "Verify email" };

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ params }: { params: { token: string } }) {
  // Read-only check only — the token is consumed by the button below, never
  // just by loading this page (see comment in reset-password/[token]).
  const check = await checkVerificationToken(params.token, "EMAIL_VERIFICATION");

  return (
    <main className="flex min-h-screen items-center py-16">
      <Container size="narrow">
        <Card>
          <CardHeader title="Verify your email" />
          {check.valid ? (
            <VerifyEmailButton token={params.token} />
          ) : (
            <div className="space-y-4">
              <Alert variant="error">
                {check.reason === "EXPIRED"
                  ? "This verification link has expired."
                  : "This verification link is invalid or has already been used."}
              </Alert>
              <Link href="/login" className="text-sm text-sky-400 hover:text-sky-300">
                Back to login
              </Link>
            </div>
          )}
        </Card>
      </Container>
    </main>
  );
}
