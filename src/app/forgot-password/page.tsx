import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Card, CardHeader } from "@/components/ui/Card";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center py-16">
      <Container size="narrow">
        <Card>
          <CardHeader
            title="Reset your password"
            description="Enter your email and we'll send you a reset link."
          />
          <ForgotPasswordForm />
        </Card>
      </Container>
    </main>
  );
}
