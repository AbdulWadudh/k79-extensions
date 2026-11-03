import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-sm border border-line bg-surface-muted text-muted">
          {icon}
        </div>
      ) : null}
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[30ch] text-[12px] leading-5 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
