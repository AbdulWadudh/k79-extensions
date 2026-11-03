import {
  ArrowUp01Icon,
  ChevronDownIcon,
  EyeOffIcon,
  Folder01Icon,
  PlusSignIcon,
  Refresh01Icon,
  Search01Icon,
  Settings02Icon,
  SidebarRight01Icon,
} from "@hugeicons/core-free-icons";
import {
  Badge,
  Button,
  cn,
  IconButton,
  Kbd,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@k79/ui";
import { type FormEvent, type RefObject, useEffect, useRef, useState } from "react";
import type { Environment, Project } from "@/api/types";
import { BrandMark } from "@/components/brand";
import { Icon } from "@/components/icon";
import { environmentDotClass, environmentTone } from "@/lib/environment";
import { parentSecretPath } from "@/lib/path";
import type { ConnectionStatus } from "@/messaging/protocol";

function PathBar({
  path,
  recentPaths,
  onPathChange,
  error,
}: {
  path: string;
  recentPaths: string[];
  onPathChange: (path: string) => void;
  error?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(path);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onPathChange(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="flex min-w-0 flex-1 items-center gap-1" onSubmit={submit}>
        <span className="font-mono text-[11px] text-muted">/</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          list="recent-secret-paths"
          aria-label="Folder path"
          className="h-7 min-w-0 flex-1 rounded-xs border border-line-strong bg-surface-raised px-2 font-mono text-[11px] text-ink focus-visible:border-accent focus-visible:outline-none"
        />
        <datalist id="recent-secret-paths">
          {recentPaths.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <Button type="submit" size="sm" variant="primary" className="h-7 px-2">
          Go
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
        {error ? <span className="sr-only">{error}</span> : null}
      </form>
    );
  }

  const parent = parentSecretPath(path);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button
        type="button"
        onClick={() => {
          setDraft(path);
          setEditing(true);
        }}
        className="flex min-w-0 items-center gap-1.5 rounded-xs px-1 py-0.5 font-mono text-[11px] text-ink-soft hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        title="Change folder path"
      >
        <Icon icon={Folder01Icon} size={13} className="shrink-0 text-muted" />
        <span className="truncate">{path}</span>
        <Icon icon={ChevronDownIcon} size={11} className="shrink-0 text-muted" />
      </button>
      {parent ? (
        <IconButton
          label="Go up one folder"
          onClick={() => onPathChange(parent)}
          className="size-6"
        >
          <Icon icon={ArrowUp01Icon} size={13} />
        </IconButton>
      ) : null}
      {error ? <span className="truncate text-[10px] text-danger">{error}</span> : null}
    </div>
  );
}

function EnvironmentPicker({
  environments,
  value,
  onChange,
}: {
  environments: Environment[];
  value?: string;
  onChange: (environment: string) => void;
}) {
  const tone = environmentTone(value ?? "");

  if (environments.length === 0) {
    return (
      <span className="flex items-center gap-1.5 px-1.5 text-[11px] text-muted">
        <span className={cn("size-1.5 rounded-full", environmentDotClass(tone))} />
        {value}
      </span>
    );
  }

  return (
    <Select
      items={environments.map((environment) => ({
        value: environment.slug,
        label: environment.name,
      }))}
      value={value}
      onValueChange={(next) => onChange(String(next ?? ""))}
    >
      <SelectTrigger
        aria-label="Environment"
        className="h-7 w-auto max-w-[130px] border-transparent bg-transparent px-1.5 text-[11px] hover:bg-surface-muted"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn("size-1.5 shrink-0 rounded-full", environmentDotClass(tone))} />
          <SelectValue placeholder="Environment" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {environments.map((environment) => (
          <SelectItem key={environment.id} value={environment.slug}>
            {environment.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function WorkspaceHeader({
  status,
  projects,
  environments,
  currentProject,
  onProjectChange,
  onEnvironmentChange,
  onPathChange,
  onNew,
  onSettings,
  onRefresh,
  onConceal,
  search,
  onSearchChange,
  searchRef,
  secretCount,
  changingScope,
  refreshing,
  pathError,
  canWrite,
  onOpenSidePanel,
}: {
  status: ConnectionStatus;
  projects: Project[];
  environments: Environment[];
  currentProject?: Project;
  onProjectChange: (projectId: string) => void;
  onEnvironmentChange: (environment: string) => void;
  onPathChange: (path: string) => void;
  onNew: () => void;
  onSettings: () => void;
  onRefresh: () => void;
  onConceal: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  secretCount: number;
  changingScope: boolean;
  refreshing: boolean;
  pathError?: string;
  canWrite: boolean;
  onOpenSidePanel?: () => void;
}) {
  return (
    <header className="shrink-0 border-b border-line bg-surface">
      <div className="flex h-[52px] items-center gap-2 px-3">
        <BrandMark />

        <div className="mx-1 h-5 w-px bg-line" aria-hidden="true" />

        <div className="flex min-w-0 flex-1 items-center gap-1">
          {status.canListProjects && projects.length > 0 ? (
            <Select
              items={projects.map((project) => ({ value: project.id, label: project.name }))}
              value={status.projectId}
              onValueChange={(value) => onProjectChange(String(value ?? ""))}
            >
              <SelectTrigger
                aria-label="Project"
                className="h-7 w-auto max-w-[120px] border-transparent bg-transparent px-1.5 text-[12px] font-medium hover:bg-surface-muted min-[480px]:max-w-[170px]"
              >
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 px-1.5 text-[12px] font-medium text-ink">
              <span className="truncate">
                {currentProject?.name ?? status.projectId ?? "Manual scope"}
              </span>
              <Badge tone="warning">Manual</Badge>
            </span>
          )}

          <div className="hidden min-[480px]:block">
            <EnvironmentPicker
              environments={environments}
              value={status.environment}
              onChange={onEnvironmentChange}
            />
          </div>

          {changingScope ? <span className="text-[10px] text-muted">Syncing…</span> : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label="Refresh secrets" onClick={onRefresh} disabled={refreshing}>
            <Icon icon={Refresh01Icon} size={14} className={cn(refreshing && "animate-spin")} />
          </IconButton>
          <IconButton label="Conceal all revealed values" onClick={onConceal}>
            <Icon icon={EyeOffIcon} size={14} />
          </IconButton>
          <IconButton label="Settings" onClick={onSettings}>
            <Icon icon={Settings02Icon} size={14} />
          </IconButton>
          <Button
            size="sm"
            variant="primary"
            onClick={onNew}
            disabled={!canWrite}
            className="ml-1 h-8 px-2.5"
            title={canWrite ? "New secret (N)" : "This identity cannot create secrets"}
          >
            <Icon icon={PlusSignIcon} size={14} />
            <span className="hidden min-[480px]:inline">New</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-line px-3 py-1.5">
        <div className="min-[480px]:hidden">
          <EnvironmentPicker
            environments={environments}
            value={status.environment}
            onChange={onEnvironmentChange}
          />
        </div>
        <PathBar
          path={status.secretPath}
          recentPaths={status.recentPaths}
          onPathChange={onPathChange}
          error={pathError}
        />
        {onOpenSidePanel ? (
          <IconButton label="Open side panel" onClick={onOpenSidePanel} className="size-6">
            <Icon icon={SidebarRight01Icon} size={14} />
          </IconButton>
        ) : null}
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
          {secretCount} {secretCount === 1 ? "key" : "keys"}
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-canvas/55 px-3 py-2">
        <Icon icon={Search01Icon} size={14} className="shrink-0 text-muted" />
        <input
          ref={searchRef}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter by key, path, or comment"
          aria-label="Filter secrets"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink placeholder:text-muted/70 focus:outline-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="rounded-xs px-1 font-mono text-[10px] text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Clear
          </button>
        ) : (
          <Kbd>/</Kbd>
        )}
      </div>
    </header>
  );
}
