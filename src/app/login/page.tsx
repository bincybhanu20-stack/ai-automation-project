import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center py-16">
      <Container size="narrow">
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold">ClientFlow</h1>
          <p className="mt-2 text-sm text-slate-400">Log in to your account</p>
        </div>

        <Card>
          {/* useSearchParams() requires a Suspense boundary in Next.js 14 */}
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </Card>
      </Container>
    </main>
  );
}
