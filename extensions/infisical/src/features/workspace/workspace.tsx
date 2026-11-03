import { AlertCircleIcon, CheckIcon } from "@hugeicons/core-free-icons";
import { cn } from "@k79/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  FolderSummary,
  MutationResult,
  SecretDetail,
  SecretScope,
  SecretSummary,
} from "@/api/types";
import { Icon } from "@/components/icon";
import { useProjects, useSetScope } from "@/features/connection/queries";
import { useFolders } from "@/features/folders/queries";
import { DeleteSecretDialog } from "@/features/secrets/delete-secret-dialog";
import { useSecretDetail, useSecrets } from "@/features/secrets/queries";
import { SecretEditor } from "@/features/secrets/secret-editor";
import { SecretInspector } from "@/features/secrets/secret-inspector";
import { SecretList } from "@/features/secrets/secret-list";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { copyText } from "@/lib/clipboard";
import { infisicalProjectUrl, openInfisicalDashboard } from "@/lib/infisical-dashboard";
import { queryKeys } from "@/lib/query-keys";
import { secretIdentity } from "@/lib/secret-identity";
import { rpc } from "@/messaging/client";
import type { ConnectionStatus } from "@/messaging/protocol";
import { EnvironmentRail } from "./env-rail";
import { WorkspaceHeader } from "./workspace-header";

type View = "list" | "detail" | "create" | "edit" | "settings";
type Toast = { message: string; tone: "success" | "danger" };

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function Workspace({
  status,
  onOpenSidePanel,
}: {
  status: ConnectionStatus;
  onOpenSidePanel?: () => void;
}) {
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<SecretSummary | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [inlineSecrets, setInlineSecrets] = useState<Record<string, string>>({});
  const [revealingKey, setRevealingKey] = useState<string | null>(null);
  const [revealingAll, setRevealingAll] = useState(false);
  const [view, setView] = useState<View>("list");
  const [toast, setToast] = useState<Toast | null>(null);
  const [pathError, setPathError] = useState<string | undefined>();
  const [readOnly, setReadOnly] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const scope: SecretScope | null =
    status.projectId && status.environment
      ? {
          projectId: status.projectId,
          environment: status.environment,
          secretPath: status.secretPath,
        }
      : null;

  function scopeForSecret(secret: SecretSummary): SecretScope | null {
    return scope ? { ...scope, secretPath: secret.path } : null;
  }

  const searchActive = search.trim().length > 0;
  const projectsQuery = useProjects(true);
  const foldersQuery = useFolders(scope, searchActive);
  const secretsQuery = useSecrets(scope, searchActive);
  const setScope = useSetScope();

  const projects = projectsQuery.data ?? [];
  const currentProject = projects.find((project) => project.id === status.projectId);
  const environments = currentProject?.environments ?? [];
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const secrets = useMemo(() => secretsQuery.data ?? [], [secretsQuery.data]);

  const selectedIdentity = selection ? secretIdentity(selection) : null;
  const selectedSecret = useMemo(() => {
    if (!selection) return null;
    return secrets.find((secret) => secretIdentity(secret) === selectedIdentity) ?? selection;
  }, [secrets, selection, selectedIdentity]);
  const selectedScope = selectedSecret ? scopeForSecret(selectedSecret) : null;
  const detailQuery = useSecretDetail(
    selectedScope,
    selectedSecret?.key ?? null,
    Boolean(selectedSecret) && (revealed || view === "edit"),
  );

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return folders;
    return folders.filter((folder) =>
      [folder.name, folder.path].some((value) => value.toLowerCase().includes(query)),
    );
  }, [folders, search]);

  const filteredSecrets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return secrets;
    return secrets.filter((secret) =>
      [secret.key, secret.path, secret.comment].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [secrets, search]);

  const secretsError =
    secretsQuery.error instanceof Error
      ? secretsQuery.error
      : secretsQuery.error
        ? new Error("Could not load secrets.")
        : null;
  const foldersError =
    foldersQuery.error instanceof Error
      ? foldersQuery.error
      : foldersQuery.error
        ? new Error("Could not load folders.")
        : null;

  const paneOpen = view === "detail" || view === "create" || view === "edit";
  const canWrite = !readOnly;
  const anyRevealed = revealed || Object.keys(inlineSecrets).length > 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset concealment when the selection changes.
  useEffect(() => {
    setRevealed(false);
  }, [selectedIdentity]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset read-only and inline reveals when the scope changes.
  useEffect(() => {
    setReadOnly(false);
    setInlineSecrets({});
    setRevealingKey(null);
  }, [status.projectId, status.environment, status.secretPath]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2_600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === "Escape") {
        if (view === "detail" || view === "create" || view === "edit" || view === "settings") {
          setView("list");
          setSelection(null);
          setRevealed(false);
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        concealAll();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c" && selectedSecret) {
        event.preventDefault();
        void copySecret(selectedSecret);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key.toLowerCase() === "n" && canWrite) {
        event.preventDefault();
        openCreate();
      }

      if (event.key.toLowerCase() === "r" && selectedSecret) {
        event.preventDefault();
        setView("detail");
        setRevealed(true);
      }

      if (event.key.toLowerCase() === "e" && selectedSecret && canWrite) {
        event.preventDefault();
        openEdit();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function showToast(message: string, tone: Toast["tone"] = "success") {
    setToast({ message, tone });
  }

  function handleForbidden() {
    setReadOnly(true);
    showToast("This identity can read this scope but cannot change it.", "danger");
  }

  async function changeScope(next: SecretScope) {
    setPathError(undefined);
    try {
      await setScope.mutateAsync(next);
      setSelection(null);
      setRevealed(false);
      setInlineSecrets({});
      setView("list");
    } catch (error) {
      setPathError(errorMessage(error));
      showToast(errorMessage(error), "danger");
    }
  }

  async function handleProjectChange(projectId: string) {
    const project = projects.find((item) => item.id === projectId);
    const environment = project?.environments[0]?.slug;
    if (!environment) {
      showToast("This project has no environments.", "danger");
      return;
    }
    await changeScope({ projectId, environment, secretPath: "/" });
  }

  async function handleEnvironmentChange(environment: string) {
    if (!status.projectId) return;
    await changeScope({
      projectId: status.projectId,
      environment,
      secretPath: status.secretPath,
    });
  }

  async function handlePathChange(path: string) {
    if (!scope) return;
    await changeScope({ ...scope, secretPath: path });
  }

  async function openFolder(folder: FolderSummary) {
    await handlePathChange(folder.path);
  }

  function openCreate() {
    if (!canWrite) return;
    setSelection(null);
    setRevealed(false);
    setView("create");
  }

  function openEdit() {
    if (!selectedSecret || !canWrite) return;
    setRevealed(false);
    setView("edit");
  }

  function selectSecret(secret: SecretSummary) {
    setSelection(secret);
    setView("detail");
    setRevealed(false);
  }

  async function fetchSecretValue(secret: SecretSummary): Promise<SecretDetail> {
    const targetScope = scopeForSecret(secret);
    if (!targetScope) throw new Error("Choose a scope first.");
    return queryClient.fetchQuery({
      queryKey: queryKeys.secret(targetScope, secret.key),
      queryFn: () =>
        rpc<SecretDetail>({
          type: "secrets.get",
          payload: { scope: targetScope, name: secret.key },
        }),
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 0,
    });
  }

  async function toggleInlineReveal(secret: SecretSummary) {
    const id = secretIdentity(secret);
    if (inlineSecrets[id] !== undefined) {
      setInlineSecrets((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return;
    }

    setRevealingKey(id);
    try {
      const detail = await fetchSecretValue(secret);
      setInlineSecrets((current) => ({ ...current, [id]: detail.value }));
    } catch (error) {
      showToast(errorMessage(error), "danger");
    } finally {
      setRevealingKey(null);
    }
  }

  async function copySecret(secret: SecretSummary) {
    if (!scope) return;
    try {
      const id = secretIdentity(secret);
      const value = inlineSecrets[id] ?? (await fetchSecretValue(secret)).value;
      await copyText(value);
      showToast(`Copied ${secret.key}`);
    } catch (error) {
      showToast(errorMessage(error), "danger");
    }
  }

  function concealAll() {
    setRevealed(false);
    setInlineSecrets({});
    queryClient.removeQueries({ queryKey: ["secret"] });
    showToast("Concealed all revealed values");
  }

  async function toggleAllReveals() {
    if (anyRevealed) {
      concealAll();
      return;
    }
    if (!scope) return;

    setRevealingAll(true);
    try {
      const details = await rpc<SecretDetail[]>({
        type: "secrets.listValues",
        payload: { scope, recursive: searchActive },
      });
      const visibleIds = new Set(filteredSecrets.map(secretIdentity));
      const next: Record<string, string> = {};
      for (const detail of details) {
        const id = secretIdentity(detail);
        if (visibleIds.has(id)) next[id] = detail.value;
      }
      setInlineSecrets(next);
      if (selectedIdentity) setRevealed(true);
      const count = Object.keys(next).length;
      showToast(`Revealed ${count} secret${count === 1 ? "" : "s"}`);
    } catch (error) {
      showToast(errorMessage(error), "danger");
    } finally {
      setRevealingAll(false);
    }
  }

  function handleSaved(result: MutationResult) {
    setInlineSecrets({});
    if (result.status === "saved") {
      setSelection(result.secret);
      setRevealed(false);
      setView("detail");
      showToast(`Saved ${result.secret.key}`);
    } else {
      setView("list");
      showToast(result.message);
    }
  }

  function handleDeleted(result: MutationResult, key: string) {
    setDeleteOpen(false);
    setSelection(null);
    setRevealed(false);
    setInlineSecrets({});
    setView("list");
    showToast(result.status === "saved" ? `Deleted ${key}` : result.message);
  }

  function closePane() {
    setView("list");
    setSelection(null);
    setRevealed(false);
  }

  if (!scope) {
    return (
      <div className="grid h-dvh place-items-center bg-canvas p-6 text-center">
        <div>
          <h1 className="text-[18px] font-semibold">Choose a scope</h1>
          <p className="mt-1 text-[12px] text-muted">Reload the panel to finish setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
      <WorkspaceHeader
        status={status}
        projects={projects}
        environments={environments}
        currentProject={currentProject}
        onProjectChange={(projectId) => void handleProjectChange(projectId)}
        onEnvironmentChange={(environment) => void handleEnvironmentChange(environment)}
        onPathChange={(path) => void handlePathChange(path)}
        onNew={openCreate}
        onSettings={() => {
          setView("settings");
          setSelection(null);
        }}
        onRefresh={() => {
          void secretsQuery.refetch();
          void foldersQuery.refetch();
        }}
        onToggleRevealAll={() => void toggleAllReveals()}
        allRevealed={anyRevealed}
        revealingAll={revealingAll}
        revealAllDisabled={secretsQuery.isLoading || foldersQuery.isLoading}
        onOpenInfisical={() =>
          void openInfisicalDashboard(
            infisicalProjectUrl(status.baseUrl, currentProject, status.secretPath),
          )
        }
        search={search}
        onSearchChange={setSearch}
        searchRef={searchRef}
        secretCount={filteredSecrets.length}
        folderCount={filteredFolders.length}
        changingScope={setScope.isPending}
        refreshing={
          (secretsQuery.isFetching && !secretsQuery.isLoading) ||
          (foldersQuery.isFetching && !foldersQuery.isLoading)
        }
        pathError={pathError}
        canWrite={canWrite}
        onOpenSidePanel={onOpenSidePanel}
      />

      {readOnly ? (
        <div className="flex items-center gap-2 border-b border-warning/30 bg-warning-soft px-3 py-2 text-[11px] text-warning">
          <Icon icon={AlertCircleIcon} size={14} />
          This identity can read this scope but cannot create, edit, or delete secrets.
        </div>
      ) : null}

      {view === "settings" ? (
        <SettingsPanel status={status} onClose={closePane} />
      ) : (
        <div className="flex min-h-0 flex-1">
          <EnvironmentRail
            environments={environments}
            current={status.environment ?? ""}
            onSelect={(environment) => void handleEnvironmentChange(environment)}
            disabled={setScope.isPending}
          />

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col bg-surface",
              paneOpen && "hidden min-[700px]:flex",
            )}
          >
            <SecretList
              folders={filteredFolders}
              secrets={filteredSecrets}
              selectedId={selectedIdentity}
              onSelect={selectSecret}
              onOpenFolder={(folder) => void openFolder(folder)}
              onCopy={(secret) => void copySecret(secret)}
              onToggleReveal={(secret) => void toggleInlineReveal(secret)}
              revealedValues={inlineSecrets}
              revealingKey={revealingKey}
              loading={secretsQuery.isLoading || foldersQuery.isLoading}
              error={secretsError}
              foldersError={foldersError}
              onRetry={() => {
                void secretsQuery.refetch();
                void foldersQuery.refetch();
              }}
              onNew={openCreate}
              hasSearch={searchActive}
              onClearSearch={() => setSearch("")}
              canWrite={canWrite}
            />
          </div>

          {paneOpen ? (
            <aside className="flex min-h-0 flex-1 flex-col border-line bg-surface min-[700px]:w-[340px] min-[700px]:flex-none min-[700px]:border-l">
              {(view === "detail" || view === "edit") && selectedSecret && selectedScope ? (
                <SecretInspector
                  secret={selectedSecret}
                  scope={selectedScope}
                  detail={detailQuery.data}
                  detailLoading={detailQuery.isFetching && !detailQuery.data}
                  detailError={
                    detailQuery.error instanceof Error
                      ? detailQuery.error
                      : detailQuery.error
                        ? new Error("Could not reveal this secret.")
                        : null
                  }
                  revealed={revealed}
                  editing={view === "edit"}
                  onToggleReveal={() => setRevealed((value) => !value)}
                  onCopy={() => void copySecret(selectedSecret)}
                  onEdit={openEdit}
                  onCancelEdit={() => {
                    setRevealed(false);
                    setView("detail");
                  }}
                  onDelete={() => setDeleteOpen(true)}
                  onBack={closePane}
                  onSaved={handleSaved}
                  onForbidden={handleForbidden}
                  readOnly={readOnly}
                />
              ) : null}

              {view === "create" ? (
                <SecretEditor
                  key="create"
                  mode="create"
                  scope={scope}
                  projectName={currentProject?.name}
                  environment={status.environment ?? ""}
                  onClose={closePane}
                  onSaved={handleSaved}
                  onForbidden={handleForbidden}
                  readOnly={readOnly}
                />
              ) : null}
            </aside>
          ) : null}
        </div>
      )}

      {deleteOpen && selectedSecret && selectedScope ? (
        <DeleteSecretDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          secret={selectedSecret}
          scope={selectedScope}
          projectName={currentProject?.name}
          environment={status.environment ?? ""}
          onDeleted={(result) => handleDeleted(result, selectedSecret.key)}
          onForbidden={handleForbidden}
        />
      ) : null}

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed bottom-16 left-1/2 z-40 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-2 rounded-sm border px-3 py-2 text-[11px] shadow-overlay transition-opacity duration-150",
          toast
            ? "border-line-strong bg-surface-raised text-ink opacity-100"
            : "border-transparent bg-transparent opacity-0",
        )}
      >
        {toast?.tone === "danger" ? (
          <Icon icon={AlertCircleIcon} size={13} className="text-danger" />
        ) : (
          <Icon icon={CheckIcon} size={13} className="text-success" />
        )}
        <span className="truncate">{toast?.message}</span>
      </div>

      {readOnly ? (
        <div className="sr-only" aria-live="polite">
          Read-only permission detected.
        </div>
      ) : null}
    </div>
  );
}
