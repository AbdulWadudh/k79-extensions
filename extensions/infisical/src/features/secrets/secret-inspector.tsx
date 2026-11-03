import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import { Badge, Button, cn, IconButton, Skeleton } from "@k79/ui";
import type { SecretDetail, SecretSummary } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { formatUpdatedAt } from "@/lib/format";

const MASK = "••••••••••••";

export function SecretInspector({
  secret,
  detail,
  detailLoading,
  detailError,
  revealed,
  onToggleReveal,
  onCopy,
  onEdit,
  onDelete,
  onBack,
  readOnly,
  projectName,
  environment,
}: {
  secret: SecretSummary;
  detail?: SecretDetail;
  detailLoading: boolean;
  detailError: Error | null;
  revealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  readOnly: boolean;
  projectName?: string;
  environment: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2">
        <IconButton label="Back to secrets" onClick={onBack} className="min-[700px]:hidden">
          <Icon icon={ArrowLeft01Icon} size={15} />
        </IconButton>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Inspector
        </span>
        <span className="ml-auto" />
        <IconButton label="Close inspector" onClick={onBack}>
          <Icon icon={Cancel01Icon} size={15} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">Shared</Badge>
          <Badge>{`v${secret.version}`}</Badge>
          {secret.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id}>{tag.name}</Badge>
          ))}
        </div>

        <h2 className="mt-3 break-all font-mono text-[19px] font-semibold leading-6 tracking-[-0.03em] text-ink">
          {secret.key}
        </h2>
        <p className="mt-1 font-mono text-[10px] text-muted">{secret.path}</p>

        <div className="mt-5 rounded-sm border border-line bg-surface-raised">
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Value
            </span>
            <div className="flex items-center gap-0.5">
              <IconButton
                label={revealed ? "Conceal value" : "Reveal value"}
                onClick={onToggleReveal}
              >
                <Icon icon={revealed ? ViewOffSlashIcon : EyeIcon} size={14} />
              </IconButton>
              <IconButton label="Copy value" onClick={onCopy}>
                <Icon icon={Copy01Icon} size={14} />
              </IconButton>
            </div>
          </div>
          <div
            className={cn(
              "min-h-28 break-all px-3 py-3 font-mono text-[12px] leading-5",
              revealed ? "text-ink" : "text-muted",
            )}
          >
            {detailLoading ? (
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
                <span className="font-sans text-[11px] leading-4 text-muted">
                  Reveal is explicit. The value is fetched only when asked for and stays in memory.
                </span>
              </span>
            )}
          </div>
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

      <div className="shrink-0 border-t border-line bg-surface p-3">
        {readOnly ? (
          <p className="mb-2 text-[11px] leading-4 text-warning">
            This identity can read this scope but cannot change it.
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="flex-1 justify-center"
            onClick={onEdit}
            disabled={readOnly}
          >
            <Icon icon={Edit02Icon} size={14} />
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="flex-1 justify-center"
            onClick={onDelete}
            disabled={readOnly}
          >
            <Icon icon={Delete02Icon} size={14} />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
