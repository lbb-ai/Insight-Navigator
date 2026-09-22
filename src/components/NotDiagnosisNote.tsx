import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotDiagnosisNote({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "subtle";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        variant === "subtle"
          ? "border-border bg-muted/60 text-muted-foreground"
          : "border-accent/30 bg-accent-soft text-accent-foreground",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">This is a screening indicator, not a diagnosis.</span> Results
        highlight patterns for a trained Disability Unit staff member to review with you. No label,
        medical finding or academic judgement is produced by this system.
      </p>
    </div>
  );
}
