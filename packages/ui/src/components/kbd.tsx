import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-line bg-surface-muted px-1.5 font-mono text-[10px] font-medium text-muted",
        className,
      )}
      {...props}
    />
  );
}
