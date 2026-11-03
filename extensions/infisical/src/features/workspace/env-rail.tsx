import { cn } from "@k79/ui";
import type { Environment } from "@/api/types";
import { environmentDotClass, environmentTone } from "@/lib/environment";

export function EnvironmentRail({
  environments,
  current,
  onSelect,
  disabled,
}: {
  environments: Environment[];
  current: string;
  onSelect: (slug: string) => void;
  disabled?: boolean;
}) {
  if (environments.length === 0) return null;

  return (
    <nav
      aria-label="Environments"
      className="hidden w-14 shrink-0 border-r border-black/20 bg-rail text-rail-ink min-[640px]:flex min-[640px]:flex-col"
    >
      <div className="h-8 border-b border-rail-ink/10" aria-hidden="true" />
      {environments.map((environment) => {
        const active = environment.slug === current;
        const tone = environmentTone(environment.slug);
        return (
          <button
            key={environment.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(environment.slug)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "group flex flex-col items-center gap-1.5 border-b border-rail-ink/8 px-1 py-3 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rail-ink/50",
              active
                ? "bg-white/8 text-rail-ink"
                : "text-rail-muted hover:bg-white/5 hover:text-rail-ink",
              disabled && "pointer-events-none opacity-45",
            )}
            title={environment.name}
          >
            <span className={cn("size-1.5 rounded-full", environmentDotClass(tone))} />
            <span className="max-w-full truncate font-mono text-[8px] uppercase tracking-[0.12em]">
              {environment.slug.slice(0, 4)}
            </span>
          </button>
        );
      })}
      <div className="mt-auto border-t border-rail-ink/10 p-2 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-rail-muted">
        Env
      </div>
    </nav>
  );
}
