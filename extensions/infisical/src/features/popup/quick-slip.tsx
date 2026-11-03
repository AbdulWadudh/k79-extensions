import {
  ArrowRight01Icon,
  Copy01Icon,
  CopyCheckIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { Badge, Button, cn, IconButton, Skeleton } from "@k79/ui";
import { useEffect, useMemo, useState } from "react";
import type { SecretDetail } from "@/api/types";
import { BrandMark } from "@/components/brand";
import { ErrorBanner as LocalErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useConnectionStatus, useProjects } from "@/features/connection/queries";
import { copyText } from "@/lib/clipboard";
import { environmentDotClass, environmentTone } from "@/lib/environment";
import { useTheme } from "@/lib/theme";
import { rpc } from "@/messaging/client";
import type { ConnectionStatus } from "@/messaging/protocol";

async function openSidePanel(): Promise<void> {
  const win = await chrome.windows.getCurrent();
  if (!win.id) throw new Error("Chrome did not return a window.");
  await chrome.sidePanel.open({ windowId: win.id });
  window.close();
}

function openPanelOrReport(setError: (message: string) => void) {
  void openSidePanel().catch((error: unknown) => {
    setError(error instanceof Error ? error.message : "Could not open the side panel.");
  });
}

function ScopeLine({ status, projectName }: { status: ConnectionStatus; projectName?: string }) {
  const tone = environmentTone(status.environment ?? "");
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
      <span className="truncate font-medium text-ink">
        {projectName ?? status.projectId ?? "No project"}
      </span>
      <span aria-hidden="true">/</span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
        <span className={cn("size-1.5 rounded-full", environmentDotClass(tone))} />
        {status.environment ?? "no env"}
      </span>
    </div>
  );
}

export function QuickSlip() {
  const statusQuery = useConnectionStatus();
  useTheme(statusQuery.data?.theme ?? "system");
  const projectsQuery = useProjects(Boolean(statusQuery.data?.connected));
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = statusQuery.data;
  const currentProject = projectsQuery.data?.find((project) => project.id === status?.projectId);

  const recents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (status?.recentSecrets ?? []).filter((item) =>
      query
        ? item.key.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)
        : true,
    );
  }, [search, status?.recentSecrets]);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), 1_400);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2_400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function copyRecent(key: string) {
    if (!status?.projectId || !status.environment) return;
    setError(null);
    try {
      const secret = await rpc<SecretDetail>({
        type: "secrets.get",
        payload: {
          scope: {
            projectId: status.projectId,
            environment: status.environment,
            secretPath: status.secretPath,
          },
          name: key,
        },
      });
      await copyText(secret.value);
      setCopiedKey(key);
      setToast(`Copied ${key}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not copy that secret.");
    }
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex h-[520px] w-[380px] flex-col bg-canvas p-4">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[12px] font-semibold">Infisical Console</span>
        </div>
        <div className="mt-6 grid gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (statusQuery.error) {
    return (
      <div className="w-[380px] p-4">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[12px] font-semibold">Infisical Console</span>
        </div>
        <LocalErrorBanner
          className="mt-4"
          message={
            statusQuery.error instanceof Error
              ? statusQuery.error.message
              : "The extension background worker did not respond."
          }
        />
      </div>
    );
  }

  if (!status?.connected || !status.projectId || !status.environment) {
    return (
      <div className="flex min-h-[480px] w-[380px] flex-col bg-canvas p-5">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="text-[12px] font-semibold">Infisical Console</span>
          <Badge className="ml-auto">K79</Badge>
        </div>

        <div className="mt-10">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
            A faster view of your secrets
          </h1>
          <p className="mt-2 max-w-[34ch] text-[12px] leading-5 text-muted">
            Connect a Machine Identity in the side panel, choose a project and environment, then
            keep the workspace open beside your work.
          </p>
        </div>

        <div className="mt-6 rounded-sm border border-line bg-surface px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-warning" />
            <span className="text-[11px] font-medium">Not connected</span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            Universal Auth only. Token-based authentication is deprecated by Infisical.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          className="mt-auto w-full justify-between"
          onClick={() => openPanelOrReport(setError)}
        >
          Open side panel
          <Icon icon={ArrowRight01Icon} size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[520px] w-[380px] flex-col bg-canvas">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
        <BrandMark />
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold">Infisical Console</div>
          <ScopeLine status={status} projectName={currentProject?.name} />
        </div>
        <span className="ml-auto flex items-center gap-1 text-[9px] uppercase tracking-[0.12em] text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Live
        </span>
      </header>

      <div className="border-b border-line bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          <Icon icon={Search01Icon} size={14} className="shrink-0 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter recent keys"
            aria-label="Filter recent keys"
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-muted/70 focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="font-mono text-[10px] text-muted hover:text-ink"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {recents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-[12px] font-medium">No recent keys yet</div>
            <p className="mt-1 text-[11px] leading-4 text-muted">
              Open the panel and reveal or copy a secret to build the list.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-none p-0" aria-label="Recent secrets">
            {recents.map((item) => (
              <li
                key={`${item.path}:${item.key}`}
                className="flex items-center gap-2 border-b border-line px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12px] font-medium text-ink">
                    {item.key}
                  </div>
                  <div className="truncate font-mono text-[10px] text-muted">{item.path}</div>
                </div>
                <IconButton label={`Copy ${item.key}`} onClick={() => void copyRecent(item.key)}>
                  <Icon
                    icon={copiedKey === item.key ? CopyCheckIcon : Copy01Icon}
                    size={14}
                    className={copiedKey === item.key ? "text-success" : undefined}
                  />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? <LocalErrorBanner className="m-3" message={error} /> : null}

      <div className="shrink-0 border-t border-line bg-surface p-3">
        <Button
          type="button"
          variant="primary"
          className="w-full justify-between"
          onClick={() => openPanelOrReport(setError)}
        >
          Open full panel
          <Icon icon={ArrowRight01Icon} size={16} />
        </Button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-16 left-1/2 z-40 -translate-x-1/2 rounded-sm border border-line-strong bg-surface-raised px-3 py-1.5 text-[11px] shadow-overlay transition-opacity",
          toast ? "opacity-100" : "opacity-0",
        )}
      >
        {toast}
      </div>
    </div>
  );
}
