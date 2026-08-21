import type { Metadata } from "next";
import "./globals.css";

/**
 * The root layout wraps EVERY page in the app.
 *
 * Next.js App Router requires this file to exist and to render <html> and
 * <body>. Without it the build fails — this was one of the blocking errors in
 * the original project.
 */

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Elicpesoftware — Client Management & AI Automation",
    // Child pages set their own title and it slots in here automatically.
    template: "%s | Elicpesoftware",
  },
  description:
    "Manage leads, clients, projects and tasks with AI-assisted qualification and n8n automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* antialiased + min-h-screen keeps the dark background covering short pages */}
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
