import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

const MAP = {
  low: {
    label: "Low",
    Icon: CheckCircle2,
    cls: "bg-risk-low-bg text-risk-low border-risk-low/30",
  },
  moderate: {
    label: "Moderate",
    Icon: AlertTriangle,
    cls: "bg-risk-moderate-bg text-risk-moderate border-risk-moderate/30",
  },
  high: {
    label: "High",
    Icon: ShieldAlert,
    cls: "bg-risk-high-bg text-risk-high border-risk-high/30",
  },
} as const;

export function RiskBadge({
  risk,
  size = "sm",
  className,
}: {
  risk: RiskLevel;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { label, Icon, cls } = MAP[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "lg" ? "px-4 py-2 text-base" : "px-2.5 py-1 text-xs",
        cls,
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-5" : "size-3.5"} aria-hidden />
      {label} risk
    </span>
  );
}
