import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-9 w-full rounded-sm border border-line-strong bg-surface-raised px-3 text-[13px] text-ink placeholder:text-muted/70",
          "transition-[border-color,box-shadow] duration-150",
          "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20",
          "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
