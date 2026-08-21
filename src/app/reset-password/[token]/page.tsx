import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { checkVerificationToken } from "@/lib/tokens";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  // Read-only check — safe even if an email client prefetches this link.
  // The token is only actually CONSUMED when the form below is submitted.
  const check = await checkVerificationToken(params.token, "PASSWORD_RESET");

  return (
    <main className="flex min-h-screen items-center py-16">
      <Container size="narrow">
        <Card>
          <CardHeader title="Set a new password" />
          {check.valid ? (
            <ResetPasswordForm token={params.token} />
          ) : (
            <div className="space-y-4">
              <Alert variant="error">
                {check.reason === "EXPIRED"
                  ? "This reset link has expired."
                  : "This reset link is invalid or has already been used."}
              </Alert>
              <Link href="/forgot-password" className="text-sm text-sky-400 hover:text-sky-300">
                Request a new reset link
              </Link>
            </div>
          )}
        </Card>
      </Container>
    </main>
  );
}
