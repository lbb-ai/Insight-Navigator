import { cn } from "@/lib/utils";
import type { RiskBand } from "@/lib/scoring";

const STYLES: Record<RiskBand, string> = {
  low: "bg-risk-low-soft text-risk-low border-risk-low/25",
  medium: "bg-risk-medium-soft text-risk-medium border-risk-medium/25",
  high: "bg-risk-high-soft text-risk-high border-risk-high/25",
};

const LABEL: Record<RiskBand, string> = {
  low: "Low indication",
  medium: "Medium indication",
  high: "High indication",
};

export function RiskBadge({
  band,
  className,
  compact,
}: {
  band: RiskBand;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        STYLES[band],
        className,
      )}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {compact ? band.toUpperCase() : LABEL[band]}
    </span>
  );
}
