import { cn } from "@k79/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/infisical.svg"
      alt=""
      width={28}
      height={28}
      className={cn("size-7 shrink-0 rounded-xs", className)}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <BrandMark />
      <div className="min-w-0 leading-none">
        <div className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
          K79 / Extensions
        </div>
        {!compact ? (
          <div className="mt-1 truncate text-[11px] font-semibold tracking-tight text-ink">
            Infisical Console
          </div>
        ) : null}
      </div>
    </div>
  );
}
