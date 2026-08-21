import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
}

export function ServiceCard({ icon: Icon, name, description }: ServiceCardProps) {
  return (
    <Card hoverable className="h-full">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/10">
        <Icon className="h-5 w-5 text-sky-400" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-100">{name}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </Card>
  );
}
