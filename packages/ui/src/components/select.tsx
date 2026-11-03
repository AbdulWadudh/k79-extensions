import { Select as BaseSelect } from "@base-ui/react/select";
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ComponentProps, forwardRef } from "react";
import { cn } from "../lib/cn";

export const Select = BaseSelect.Root;
export const SelectValue = BaseSelect.Value;

export const SelectTrigger = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof BaseSelect.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <BaseSelect.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-sm border border-line-strong bg-surface-raised px-3 text-left text-[13px] text-ink",
        "transition-[border-color,box-shadow] duration-150",
        "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/20",
        "data-[popup-open]:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate">{children}</span>
      <BaseSelect.Icon className="text-muted">
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} aria-hidden="true" />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
});

export function SelectContent({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={6} className="z-50">
        <BaseSelect.Popup
          className={cn(
            "max-h-64 min-w-[var(--anchor-width)] overflow-y-auto rounded-sm border border-line-strong bg-surface-raised p-1 shadow-overlay",
            "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            "transition-opacity duration-150",
            className,
          )}
          {...props}
        >
          <BaseSelect.List>{children}</BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      className={cn(
        "flex cursor-default select-none items-center justify-between gap-3 rounded-xs px-2 py-1.5 text-[12px] text-ink outline-none",
        "data-[highlighted]:bg-accent-soft data-[selected]:font-medium",
        className,
      )}
      {...props}
    >
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className="text-accent">
        <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2} aria-hidden="true" />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}
