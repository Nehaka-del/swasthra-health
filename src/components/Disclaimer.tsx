import { Info } from "lucide-react";

import { DISCLAIMER } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex gap-2 rounded-xl border border-accent bg-accent/60 p-3 text-sm text-accent-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
