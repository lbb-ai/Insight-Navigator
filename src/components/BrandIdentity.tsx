import { BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-brand-mark text-brand-mark-foreground shadow-[var(--shadow-brand)]",
        className,
      )}
      aria-hidden="true"
    >
      <BookOpen className="size-6" strokeWidth={2.25} />
      <span className="absolute right-1.5 top-1.5 grid size-3.5 place-items-center rounded-full bg-brand-spark text-brand-spark-foreground">
        <Sparkles className="size-2.5" strokeWidth={3} />
      </span>
      <span className="absolute inset-x-2 bottom-1.5 h-0.5 bg-brand-spark" />
    </span>
  );
}

export function BrandIdentity({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <BrandMark className={compact ? "size-10" : "size-12"} />
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block font-display font-bold",
            compact ? "text-sm" : "text-base",
            inverted ? "text-brand-on-dark" : "text-foreground",
          )}
        >
          LearnAware
        </span>
        <span
          className={cn(
            "block text-xs font-medium",
            inverted ? "text-brand-on-dark-muted" : "text-muted-foreground",
          )}
        >
          DUT Disability Unit
        </span>
      </span>
    </span>
  );
}