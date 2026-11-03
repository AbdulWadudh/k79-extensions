import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

type BadgeTone = "neutral" | "accent" | "danger" | "warning" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line bg-surface-muted text-ink-soft",
  accent: "border-accent/30 bg-accent-soft text-accent",
  danger: "border-danger/30 bg-danger-soft text-danger",
  warning: "border-warning/30 bg-warning-soft text-warning",
  success: "border-success/30 bg-success-soft text-success",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
