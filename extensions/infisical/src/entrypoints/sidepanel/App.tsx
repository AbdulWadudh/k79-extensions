import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Button, Skeleton } from "@k79/ui";
import { useQueryClient } from "@tanstack/react-query";
import { BrandMark } from "@/components/brand";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { Onboarding } from "@/features/connection/onboarding";
import { useConnectionStatus } from "@/features/connection/queries";
import { Workspace } from "@/features/workspace/workspace";
import { queryKeys } from "@/lib/query-keys";
import { useTheme } from "@/lib/theme";
import type { ConnectionStatus } from "@/messaging/protocol";

function StartupSplash() {
  return (
    <div className="flex h-dvh flex-col bg-canvas p-4">
      <div className="flex items-center gap-2">
        <BrandMark />
        <div className="leading-none">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            K79 / Extensions
          </div>
          <div className="mt-1 text-[11px] font-semibold">Infisical Console</div>
        </div>
      </div>
      <div
        className="mt-8 grid gap-2"
        role="status"
        aria-busy="true"
        aria-label="Opening workspace"
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="mt-auto font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        Opening ledger
      </div>
    </div>
  );
}

export function App() {
  const queryClient = useQueryClient();
  const statusQuery = useConnectionStatus();
  useTheme(statusQuery.data?.theme ?? "system");

  function completeSetup(status: ConnectionStatus) {
    queryClient.setQueryData(queryKeys.status, status);
    queryClient.removeQueries({ queryKey: ["secrets"] });
    queryClient.removeQueries({ queryKey: ["secret"] });
  }

  if (statusQuery.isLoading) return <StartupSplash />;

  if (statusQuery.error) {
    return (
      <div className="grid h-dvh place-items-center bg-canvas p-4">
        <div className="w-full max-w-sm">
          <div className="mb-4 flex items-center gap-2">
            <BrandMark />
            <span className="text-[12px] font-semibold">Infisical Console</span>
          </div>
          <ErrorBanner
            title="Could not open the workspace"
            message={
              statusQuery.error instanceof Error
                ? statusQuery.error.message
                : "The extension background worker did not respond."
            }
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-full justify-center"
            onClick={() => void statusQuery.refetch()}
          >
            <Icon icon={AlertCircleIcon} size={14} />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const status = statusQuery.data;
  if (!status) return <StartupSplash />;

  if (!status.connected || !status.projectId || !status.environment) {
    return (
      <Onboarding
        initialStatus={status.connected ? status : undefined}
        onComplete={completeSetup}
      />
    );
  }

  return <Workspace status={status} />;
}
