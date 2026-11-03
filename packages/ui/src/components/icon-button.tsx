import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/cn";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "danger";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, tone = "default", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-xs text-muted transition-colors duration-150",
        "hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "danger" && "hover:bg-danger-soft hover:text-danger",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
