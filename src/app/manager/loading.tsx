import { Loader2 } from "lucide-react";

// Scoped to /manager only — see the comment in src/app/admin/loading.tsx
// for why this must not be a root-level loading.tsx.
export default function ManagerLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-crimson" aria-hidden="true" />
    </div>
  );
}
