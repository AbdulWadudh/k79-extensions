import {
  Copy01Icon,
  CopyCheckIcon,
  EyeIcon,
  Key01Icon,
  Search01Icon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { Badge, Button, cn, EmptyState, IconButton, Skeleton, Spinner } from "@k79/ui";
import { type KeyboardEvent, useRef } from "react";
import type { SecretSummary } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { formatRelativeTime } from "@/lib/format";

const MASK = "••••••••••••";

export function SecretList({
  secrets,
  selectedKey,
  onSelect,
  onCopy,
  onToggleReveal,
  revealedValues,
  revealingKey,
  copiedKey,
  loading,
  error,
  onRetry,
  onNew,
  hasSearch,
  onClearSearch,
  canWrite,
}: {
  secrets: SecretSummary[];
  selectedKey: string | null;
  onSelect: (secret: SecretSummary) => void;
  onCopy: (secret: SecretSummary) => void;
  onToggleReveal: (secret: SecretSummary) => void;
  revealedValues: Record<string, string>;
  revealingKey: string | null;
  copiedKey: string | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onNew: () => void;
  hasSearch: boolean;
  onClearSearch: () => void;
  canWrite: boolean;
}) {
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  function moveFocus(currentKey: string, direction: -1 | 1) {
    const index = secrets.findIndex((secret) => secret.key === currentKey);
    const next = secrets[index + direction];
    if (next) rowRefs.current.get(next.key)?.focus();
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLButtonElement>, secret: SecretSummary) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(secret.key, 1);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(secret.key, -1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      const first = secrets[0];
      if (first) rowRefs.current.get(first.key)?.focus();
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = secrets.at(-1);
      if (last) rowRefs.current.get(last.key)?.focus();
    }
  }

  if (loading) {
    return (
      <div
        className="grid gap-px bg-line"
        role="status"
        aria-busy="true"
        aria-label="Loading secrets"
      >
        {["one", "two", "three", "four", "five", "six", "seven"].map((row) => (
          <div key={row} className="bg-surface px-3 py-2.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-2 h-2.5 w-52" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner title="Could not load secrets" message={error.message} />
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (secrets.length === 0) {
    return hasSearch ? (
      <EmptyState
        icon={<Icon icon={Search01Icon} size={18} />}
        title="No matching keys"
        description="Try a different key, path, or comment. Search is local and never reads values."
        action={
          <Button type="button" variant="secondary" size="sm" onClick={onClearSearch}>
            Clear filter
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<Icon icon={Key01Icon} size={18} />}
        title="No secrets in this folder"
        description={
          canWrite
            ? "Create the first shared secret here, or move up to another folder."
            : "This identity can read this scope but cannot create secrets."
        }
        action={
          canWrite ? (
            <Button type="button" variant="primary" size="sm" onClick={onNew}>
              New secret
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ul className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-0" aria-label="Secrets">
      {secrets.map((secret) => {
        const selected = secret.key === selectedKey;
        const copied = secret.key === copiedKey;
        const revealedValue = revealedValues[secret.key];
        const isRevealed = revealedValue !== undefined;
        const isRevealing = revealingKey === secret.key;
        return (
          <li
            key={`${secret.path}:${secret.key}`}
            className={cn(
              "group flex items-stretch border-b border-line transition-colors",
              selected
                ? "border-l border-l-accent bg-accent-soft/55"
                : "border-l border-l-transparent hover:bg-surface-muted/60",
            )}
          >
            <button
              ref={(node) => {
                if (node) rowRefs.current.set(secret.key, node);
                else rowRefs.current.delete(secret.key);
              }}
              type="button"
              onClick={() => onSelect(secret)}
              onKeyDown={(event) => onRowKeyDown(event, secret)}
              aria-current={selected ? "true" : undefined}
              className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
            >
              <Icon
                icon={Key01Icon}
                size={14}
                className={cn("shrink-0", selected ? "text-accent" : "text-muted")}
              />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-mono text-[12px] font-medium tracking-[-0.01em] text-ink">
                    {secret.key}
                  </span>
                  <Badge tone={selected ? "accent" : "neutral"}>{`v${secret.version}`}</Badge>
                </span>
                {isRevealed ? (
                  <span className="mt-0.5 block whitespace-pre-wrap break-all font-mono text-[11px] leading-4 text-ink">
                    {revealedValue || "(empty value)"}
                  </span>
                ) : (
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] text-muted">
                    <span className="shrink-0 font-mono tracking-[0.16em]" aria-hidden="true">
                      {MASK}
                    </span>
                    <span className="shrink-0" aria-hidden="true">
                      ·
                    </span>
                    <span className="truncate font-mono">
                      {secret.path === "/" ? "root" : secret.path}
                    </span>
                    <span className="shrink-0" aria-hidden="true">
                      ·
                    </span>
                    <span className="shrink-0">{formatRelativeTime(secret.updatedAt)}</span>
                  </span>
                )}
                {isRevealed ? (
                  <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-muted">
                    <span className="truncate font-mono">
                      {secret.path === "/" ? "root" : secret.path}
                    </span>
                    <span className="shrink-0" aria-hidden="true">
                      ·
                    </span>
                    <span className="shrink-0">{formatRelativeTime(secret.updatedAt)}</span>
                  </span>
                ) : null}
              </span>
            </button>

            <div className="flex shrink-0 items-center gap-0.5 pr-2 opacity-100 transition-opacity min-[480px]:opacity-0 min-[480px]:group-focus-within:opacity-100 min-[480px]:group-hover:opacity-100">
              <IconButton
                label={copied ? "Copied" : "Copy secret value"}
                onClick={() => onCopy(secret)}
                className="size-7"
              >
                <Icon
                  icon={copied ? CopyCheckIcon : Copy01Icon}
                  size={13}
                  className={copied ? "text-success" : undefined}
                />
              </IconButton>
              <IconButton
                label={isRevealed ? "Conceal secret value" : "Reveal secret value"}
                onClick={() => onToggleReveal(secret)}
                aria-pressed={isRevealed}
                className="size-7"
              >
                {isRevealing ? (
                  <Spinner className="size-3" label="Revealing value" />
                ) : (
                  <Icon icon={isRevealed ? ViewOffSlashIcon : EyeIcon} size={13} />
                )}
              </IconButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
