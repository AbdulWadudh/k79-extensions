import { cn } from "@k79/ui";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-xs border border-current/25 bg-rail text-rail-ink",
        className,
      )}
      aria-hidden="true"
    >
      <span className="font-mono text-[12px] font-semibold leading-none tracking-[-0.08em]">K</span>
      <span className="absolute bottom-1 right-1 size-1 rounded-full bg-[#cfe3d6]" />
    </div>
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
