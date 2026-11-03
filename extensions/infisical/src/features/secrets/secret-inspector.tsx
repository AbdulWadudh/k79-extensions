import {
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckIcon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { Badge, cn, IconButton, Input, Skeleton, Spinner, Textarea } from "@k79/ui";
import { useEffect, useState } from "react";
import type { MutationResult, SecretDetail, SecretScope, SecretSummary } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useUpdateSecret } from "@/features/secrets/queries";
import { formatUpdatedAt } from "@/lib/format";
import { normalizeSecretKeyInput } from "@/lib/secret-key";
import { RpcClientError } from "@/messaging/client";

const MASK = "••••••••••••";

export function SecretInspector({
  secret,
  scope,
  detail,
  detailLoading,
  detailError,
  revealed,
  editing,
  onToggleReveal,
  onCopy,
  onEdit,
  onCancelEdit,
  onDelete,
  onBack,
  onSaved,
  onForbidden,
  readOnly,
  projectName,
  environment,
}: {
  secret: SecretSummary;
  scope: SecretScope;
  detail?: SecretDetail;
  detailLoading: boolean;
  detailError: Error | null;
  revealed: boolean;
  editing: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onSaved: (result: MutationResult) => void;
  onForbidden: () => void;
  readOnly: boolean;
  projectName?: string;
  environment: string;
}) {
  const update = useUpdateSecret(scope, secret.key);
  const [draftKey, setDraftKey] = useState(secret.key);
  const [draftValue, setDraftValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    setDraftKey(secret.key);
    setEditError(null);
  }, [editing, secret.key]);

  useEffect(() => {
    if (!editing) return;
    setDraftValue(detail?.value ?? "");
  }, [editing, detail?.value]);

  const editLoading = editing && !detail;

  async function saveInline() {
    setEditError(null);
    const nextKey = draftKey.trim();
    if (!nextKey) {
      setEditError("Enter a secret key.");
      return;
    }

    try {
      const result = await update.mutateAsync({
        name: secret.key,
        newName: nextKey,
        value: draftValue,
        comment: detail?.comment ?? secret.comment,
      });
      onSaved(result);
    } catch (error) {
      if (error instanceof RpcClientError && error.code === "forbidden") onForbidden();
      setEditError(error instanceof Error ? error.message : "Could not save this secret.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2">
        <IconButton label="Back to secrets" onClick={onBack} className="min-[700px]:hidden">
          <Icon icon={ArrowLeft01Icon} size={15} />
        </IconButton>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Inspector
        </span>
        <Badge tone="accent">Shared</Badge>
        <Badge>{`v${secret.version}`}</Badge>
        <span className="ml-auto" />
        <IconButton label="Close inspector" onClick={onBack}>
          <Icon icon={Cancel01Icon} size={15} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {readOnly ? (
          <p className="mb-4 text-[10px] leading-4 text-warning">
            This identity can read this scope but cannot change it.
          </p>
        ) : null}

        <div className="rounded-sm border border-line bg-surface-raised">
          <div className="flex min-h-9 items-center border-b border-line px-3 py-2">
            {editing ? (
              <Input
                aria-label="Key"
                value={draftKey}
                onChange={(event) => setDraftKey(normalizeSecretKeyInput(event.target.value))}
                disabled={update.isPending}
                className="h-7 border-0 bg-transparent px-0 font-mono text-[11px] shadow-none focus-visible:ring-0"
              />
            ) : (
              <span className="min-w-0 break-all font-mono text-[11px] font-medium text-ink">
                {secret.key}
              </span>
            )}
          </div>

          <div
            className={cn(
              "min-h-28 break-all px-3 py-3 font-mono text-[12px] leading-5",
              editing || revealed ? "text-ink" : "text-muted",
            )}
          >
            {editing ? (
              editLoading ? (
                <div
                  className="grid gap-2"
                  role="status"
                  aria-busy="true"
                  aria-label="Loading secret value"
                >
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : detailError ? (
                <ErrorBanner title="Could not load this secret" message={detailError.message} />
              ) : (
                <Textarea
                  aria-label="Value"
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.target.value)}
                  rows={5}
                  disabled={update.isPending}
                  className="min-h-28 resize-y border-0 bg-transparent p-0 font-mono text-[12px] leading-5 shadow-none focus-visible:ring-0"
                />
              )
            ) : detailLoading ? (
              <div
                className="grid gap-2"
                role="status"
                aria-busy="true"
                aria-label="Loading secret value"
              >
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : detailError ? (
              <ErrorBanner title="Could not reveal" message={detailError.message} />
            ) : revealed && detail ? (
              <span className="whitespace-pre-wrap">{detail.value || " "}</span>
            ) : (
              <span className="flex flex-col gap-2">
                <span className="sr-only">Value hidden.</span>
                <span className="tracking-[0.2em]" aria-hidden="true">
                  {MASK}
                </span>
              </span>
            )}
          </div>

          {editing ? (
            <div className="flex items-center justify-end gap-0.5 border-t border-line px-2 py-1.5">
              {editError ? (
                <span className="mr-auto max-w-[55%] truncate text-[10px] text-danger">
                  {editError}
                </span>
              ) : null}
              <IconButton label="Cancel edit" onClick={onCancelEdit} disabled={update.isPending}>
                <Icon icon={Cancel01Icon} size={14} />
              </IconButton>
              <IconButton
                label="Save changes"
                onClick={saveInline}
                disabled={update.isPending || editLoading}
              >
                {update.isPending ? (
                  <Spinner className="size-3.5" label="Saving changes" />
                ) : (
                  <Icon icon={CheckIcon} size={14} />
                )}
              </IconButton>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-0.5 border-t border-line px-2 py-1.5">
              <IconButton
                label={revealed ? "Conceal value" : "Reveal value"}
                onClick={onToggleReveal}
              >
                <Icon icon={revealed ? ViewOffSlashIcon : EyeIcon} size={14} />
              </IconButton>
              <IconButton label="Copy value" onClick={onCopy}>
                <Icon icon={Copy01Icon} size={14} />
              </IconButton>
              <IconButton label="Edit" onClick={onEdit} disabled={readOnly}>
                <Icon icon={Edit02Icon} size={14} />
              </IconButton>
              <IconButton label="Delete" onClick={onDelete} disabled={readOnly} tone="danger">
                <Icon icon={Delete02Icon} size={14} />
              </IconButton>
            </div>
          )}
        </div>

        {secret.comment ? (
          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Comment
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-5 text-ink-soft">
              {secret.comment}
            </p>
          </div>
        ) : null}

        <dl className="mt-5 grid gap-2 border-t border-line pt-4 text-[11px]">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Project</dt>
            <dd className="max-w-[65%] truncate text-right font-mono text-ink-soft">
              {projectName ?? "—"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Environment</dt>
            <dd className="font-mono text-ink-soft">{environment}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Path</dt>
            <dd className="max-w-[65%] truncate text-right font-mono text-ink-soft">
              {secret.path}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">Updated</dt>
            <dd className="text-right text-ink-soft">{formatUpdatedAt(secret.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
