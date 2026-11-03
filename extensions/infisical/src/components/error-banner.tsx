import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { cn } from "@k79/ui";
import { Icon } from "./icon";

export function ErrorBanner({
  title = "Request failed",
  message,
  className,
}: {
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-sm border border-danger/30 bg-danger-soft px-3 py-2.5 text-danger",
        className,
      )}
    >
      <Icon icon={AlertCircleIcon} size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-danger/90">{message}</p>
      </div>
    </div>
  );
}
