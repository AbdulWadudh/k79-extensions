import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type ButtonSize = "sm" | "md" | "icon" | "icon-sm";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border border-accent bg-accent text-accent-ink hover:bg-accent/90 active:translate-y-px",
  secondary:
    "border border-line-strong bg-surface-raised text-ink hover:border-ink-soft hover:bg-surface active:translate-y-px",
  ghost: "border border-transparent text-ink-soft hover:bg-surface-muted hover:text-ink",
  danger: "border border-danger bg-danger text-danger-ink hover:bg-danger/90 active:translate-y-px",
  quiet: "border border-transparent text-muted hover:bg-surface-muted hover:text-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-[12px]",
  md: "h-9 gap-2 px-4 text-[13px]",
  icon: "size-9 justify-center p-0",
  "icon-sm": "size-7 justify-center p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "secondary", size = "md", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm font-medium transition-[background-color,border-color,color,transform] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-3.5" label="Working" /> : null}
      {children}
    </button>
  );
});
