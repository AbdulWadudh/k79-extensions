import { AlertCircleIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from "@k79/ui";
import { useState } from "react";
import type { MutationResult, SecretScope, SecretSummary } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useDeleteSecret } from "@/features/secrets/queries";
import { RpcClientError } from "@/messaging/client";

export function DeleteSecretDialog({
  open,
  onOpenChange,
  secret,
  scope,
  projectName,
  environment,
  onDeleted,
  onForbidden,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secret: SecretSummary;
  scope: SecretScope;
  projectName?: string;
  environment: string;
  onDeleted: (result: MutationResult) => void;
  onForbidden: () => void;
}) {
  const remove = useDeleteSecret(scope);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    try {
      const result = await remove.mutateAsync(secret.key);
      onDeleted(result);
    } catch (nextError) {
      if (nextError instanceof RpcClientError && nextError.code === "forbidden") onForbidden();
      setError(nextError instanceof Error ? nextError.message : "Could not delete this secret.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-sm border border-danger/30 bg-danger-soft text-danger">
            <Icon icon={AlertCircleIcon} size={17} />
          </div>
          <div className="min-w-0">
            <DialogTitle>Delete this secret?</DialogTitle>
            <DialogDescription>
              This removes the secret from Infisical. The action is permanent and is recorded in the
              workspace audit trail.
            </DialogDescription>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-line rounded-sm border border-line bg-surface">
          {[
            ["Key", secret.key],
            ["Project", projectName ?? scope.projectId],
            ["Environment", environment],
            ["Path", secret.path],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2">
              <dt className="w-20 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                {label}
              </dt>
              <dd className="min-w-0 truncate font-mono text-[11px] text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        {error ? <ErrorBanner className="mt-3" message={error} /> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={confirm}
            loading={remove.isPending}
          >
            <Icon icon={Delete02Icon} size={14} />
            Delete secret
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
