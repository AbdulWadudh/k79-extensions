import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

type SpinnerProps = Omit<ComponentProps<typeof HugeiconsIcon>, "icon"> & {
  label?: string;
};

export function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <HugeiconsIcon
        icon={Loading03Icon}
        size={16}
        strokeWidth={1.8}
        className={cn("animate-spin", className)}
        aria-hidden="true"
        {...props}
      />
    </span>
  );
}
