import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight01Icon,
  CheckIcon,
  Folder01Icon,
  GlobeIcon,
  Key01Icon,
  LockKeyIcon,
  ServerStack01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import {
  Badge,
  Button,
  cn,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Kbd,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@k79/ui";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { Environment, Project } from "@/api/types";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useConnect, useProjects } from "@/features/connection/queries";
import { requestInstancePermission } from "@/lib/permissions";
import { rpc } from "@/messaging/client";
import type { ConnectionStatus } from "@/messaging/protocol";

const connectSchema = z.object({
  baseUrl: z.string().trim().min(1, "Enter your Infisical instance URL."),
  clientId: z.string().trim().min(1, "Enter the Machine Identity Client ID."),
  clientSecret: z.string().min(1, "Enter the Machine Identity Client Secret."),
  rememberCredentials: z.boolean(),
});

type ConnectValues = z.infer<typeof connectSchema>;
type Step = "connect" | "scope" | "ready";
type InstanceChoice = "us" | "eu" | "self";

const steps: Array<{ id: Step; label: string; detail: string }> = [
  { id: "connect", label: "Connect", detail: "Identity" },
  { id: "scope", label: "Scope", detail: "Project" },
  { id: "ready", label: "Ready", detail: "Workspace" },
];

function StepRail({ step }: { step: Step }) {
  const activeIndex = steps.findIndex((item) => item.id === step);

  return (
    <ol className="grid gap-1.5" aria-label="Setup progress">
      {steps.map((item, index) => {
        const active = item.id === step;
        const complete = index < activeIndex;
        return (
          <li
            key={item.id}
            className={cn(
              "flex items-center gap-2 rounded-xs px-2 py-1.5 text-rail-ink/65",
              active && "bg-white/8 text-rail-ink",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border border-rail-ink/25 font-mono text-[9px]",
                active && "border-rail-ink/40 bg-rail-ink text-rail",
                complete && "border-[#9ed3b0] bg-[#9ed3b0] text-[#0d1411]",
              )}
            >
              {complete ? <Icon icon={CheckIcon} size={11} strokeWidth={2.2} /> : `0${index + 1}`}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium leading-none">{item.label}</span>
              <span className="mt-0.5 block font-mono text-[8px] uppercase tracking-[0.14em] text-rail-muted">
                {item.detail}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function rememberSummary(remember: boolean): string {
  return remember ? "Remembered on this device" : "Session only";
}

export function Onboarding({
  initialStatus,
  onComplete,
}: {
  initialStatus?: ConnectionStatus;
  onComplete: (status: ConnectionStatus) => void;
}) {
  const [step, setStep] = useState<Step>(initialStatus?.connected ? "scope" : "connect");
  const [instance, setInstance] = useState<InstanceChoice>(
    initialStatus?.baseUrl === "https://eu.infisical.com" ? "eu" : "us",
  );
  const [flowError, setFlowError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(initialStatus?.projectId ?? "");
  const [environment, setEnvironment] = useState(initialStatus?.environment ?? "");
  const [secretPath, setSecretPath] = useState(initialStatus?.secretPath ?? "/");
  const [manualScope, setManualScope] = useState(!initialStatus?.canListProjects);
  const [readyStatus, setReadyStatus] = useState<ConnectionStatus | null>(null);

  const connect = useConnect();
  const projectsQuery = useProjects(Boolean(initialStatus?.connected) && step === "scope");

  const form = useForm<ConnectValues>({
    resolver: zodResolver(connectSchema),
    mode: "onTouched",
    defaultValues: {
      baseUrl: initialStatus?.baseUrl ?? "https://us.infisical.com",
      clientId: "",
      clientSecret: "",
      rememberCredentials: initialStatus?.rememberCredentials ?? false,
    },
  });

  const effectiveProjects = projects.length > 0 ? projects : (projectsQuery.data ?? []);
  const selectedProject = effectiveProjects.find((project) => project.id === projectId);
  const environments: Environment[] = selectedProject?.environments ?? [];
  const showManualScope =
    manualScope || (!projectsQuery.isLoading && effectiveProjects.length === 0);

  async function onConnect(values: ConnectValues) {
    setFlowError(null);
    try {
      await requestInstancePermission(values.baseUrl);
      const result = await connect.mutateAsync(values);
      setProjects(result.projects);
      setManualScope(!result.canListProjects || result.projects.length === 0);
      setProjectId(result.projects[0]?.id ?? "");
      setEnvironment(result.projects[0]?.environments[0]?.slug ?? "");
      setStep("scope");
      form.reset({ ...values, clientSecret: "" });
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : "Could not connect to Infisical.");
    }
  }

  function chooseProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    const nextProject = effectiveProjects.find((project) => project.id === nextProjectId);
    const nextEnvironment = nextProject?.environments[0]?.slug ?? "";
    setEnvironment(nextEnvironment);
  }

  async function confirmScope() {
    setScopeError(null);
    const nextProjectId = projectId.trim();
    const nextEnvironment = environment.trim();
    const nextPath = secretPath.trim() || "/";

    if (!nextProjectId) {
      setScopeError("Enter a project ID or choose a project.");
      return;
    }
    if (!nextEnvironment) {
      setScopeError("Enter an environment slug or choose an environment.");
      return;
    }

    try {
      const status = await rpc<ConnectionStatus>({
        type: "scope.set",
        payload: {
          scope: {
            projectId: nextProjectId,
            environment: nextEnvironment,
            secretPath: nextPath,
          },
        },
      });
      setReadyStatus(status);
      setStep("ready");
    } catch (error) {
      setScopeError(error instanceof Error ? error.message : "Could not save that scope.");
    }
  }

  const readyProject = effectiveProjects.find((project) => project.id === projectId);

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] bg-canvas text-ink min-[720px]:grid-cols-[230px_minmax(0,1fr)] min-[720px]:grid-rows-1">
      <aside className="border-b border-black/20 bg-rail px-4 py-3 text-rail-ink min-[720px]:flex min-[720px]:flex-col min-[720px]:border-b-0 min-[720px]:border-r min-[720px]:border-black/20 min-[720px]:p-5">
        <div className="flex items-center justify-between gap-3 min-[720px]:block">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-xs border border-rail-ink/25 bg-rail-ink/10 font-mono text-[12px] font-semibold">
              K
            </div>
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-rail-muted">
                K79 / Extensions
              </div>
              <div className="mt-0.5 text-[10px] font-medium text-rail-ink/75 min-[720px]:hidden">
                Infisical Console
              </div>
            </div>
          </div>
          <div className="hidden min-[720px]:mt-7 min-[720px]:block">
            <div className="text-[18px] font-semibold tracking-tight">Infisical Console</div>
            <div className="mt-1 text-[11px] leading-4 text-rail-muted">
              A controlled view of the secrets behind your work.
            </div>
          </div>
        </div>

        <div className="mt-4 min-[720px]:mt-8">
          <StepRail step={step} />
        </div>

        <div className="mt-auto hidden border-t border-rail-ink/12 pt-4 min-[720px]:block">
          <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-rail-muted">
            <Icon icon={Shield01Icon} size={12} />
            Local session
          </div>
          <p className="mt-2 text-[10px] leading-4 text-rail-muted">
            Secret values stay in memory. Credentials are stored only when you ask us to remember
            them.
          </p>
        </div>
      </aside>

      <main className="min-h-0 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col px-5 py-7 min-[720px]:px-10 min-[720px]:py-10">
          {step === "connect" ? (
            <section className="animate-fade-in">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em]">
                  Connect your instance
                </h1>
                <Badge tone="accent">Universal Auth</Badge>
              </div>
              <p className="mt-2 max-w-[46ch] text-[12px] leading-5 text-muted">
                Use a Machine Identity with access to the project you want to work in. Token-based
                authentication is deprecated by Infisical, so this extension uses Universal Auth
                only.
              </p>

              <form className="mt-6 grid gap-5" onSubmit={form.handleSubmit(onConnect)} noValidate>
                <div className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                    Instance
                  </span>
                  <div className="grid grid-cols-3 gap-1 rounded-sm border border-line bg-surface-muted p-1">
                    {[
                      { id: "us" as const, label: "US Cloud", icon: GlobeIcon },
                      { id: "eu" as const, label: "EU Cloud", icon: GlobeIcon },
                      { id: "self" as const, label: "Self-hosted", icon: ServerStack01Icon },
                    ].map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        aria-pressed={instance === choice.id}
                        onClick={() => {
                          setInstance(choice.id);
                          if (choice.id !== "self") {
                            form.setValue(
                              "baseUrl",
                              choice.id === "us"
                                ? "https://us.infisical.com"
                                : "https://eu.infisical.com",
                              { shouldValidate: true },
                            );
                          }
                        }}
                        className={cn(
                          "flex h-8 items-center justify-center gap-1.5 rounded-xs px-2 text-[11px] font-medium transition-colors",
                          instance === choice.id
                            ? "bg-surface-raised text-ink shadow-sm"
                            : "text-muted hover:text-ink",
                        )}
                      >
                        <Icon icon={choice.icon} size={13} />
                        <span className="truncate">{choice.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {instance === "self" ? (
                  <Controller
                    name="baseUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        name={field.name}
                        invalid={fieldState.invalid}
                        dirty={fieldState.isDirty}
                      >
                        <FieldLabel htmlFor="base-url">Instance URL</FieldLabel>
                        <Input
                          {...field}
                          id="base-url"
                          autoComplete="url"
                          placeholder="https://infisical.example.com"
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldDescription>
                          HTTPS is required. Chrome will ask for permission to reach this origin.
                        </FieldDescription>
                        {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                      </Field>
                    )}
                  />
                ) : (
                  <input type="hidden" {...form.register("baseUrl")} />
                )}

                <Controller
                  name="clientId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      name={field.name}
                      invalid={fieldState.invalid}
                      dirty={fieldState.isDirty}
                    >
                      <FieldLabel htmlFor="client-id">Client ID</FieldLabel>
                      <Input
                        {...field}
                        id="client-id"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Machine Identity Client ID"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />

                <Controller
                  name="clientSecret"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      name={field.name}
                      invalid={fieldState.invalid}
                      dirty={fieldState.isDirty}
                    >
                      <FieldLabel htmlFor="client-secret">Client Secret</FieldLabel>
                      <Input
                        {...field}
                        id="client-secret"
                        type="password"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="Machine Identity Client Secret"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldDescription>
                        Exchanged for a short-lived access token. It is never logged.
                      </FieldDescription>
                      {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                  )}
                />

                <Controller
                  name="rememberCredentials"
                  control={form.control}
                  render={({ field }) => (
                    <Field className="flex flex-row items-start justify-between gap-4 rounded-sm border border-line bg-surface/60 p-3">
                      <div className="min-w-0">
                        <FieldLabel
                          htmlFor="remember-credentials"
                          className="normal-case tracking-normal"
                        >
                          Remember on this device
                        </FieldLabel>
                        <FieldDescription>
                          Stores the Client ID and Secret unencrypted in this browser profile.
                          Otherwise they live only for this browser session.
                        </FieldDescription>
                      </div>
                      <Switch
                        id="remember-credentials"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Remember credentials on this device"
                      />
                    </Field>
                  )}
                />

                {flowError ? <ErrorBanner message={flowError} /> : null}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full justify-between"
                  loading={connect.isPending}
                >
                  <span>Connect and continue</span>
                  <Icon icon={ArrowRight01Icon} size={16} />
                </Button>
              </form>
            </section>
          ) : null}

          {step === "scope" ? (
            <section className="animate-fade-in">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em]">Choose a scope</h1>
                <Badge tone="accent">Step 02</Badge>
              </div>
              <p className="mt-2 max-w-[46ch] text-[12px] leading-5 text-muted">
                Pick the project, environment, and folder this panel should work in. You can change
                them later from the workspace.
              </p>

              <div className="mt-6 grid gap-4">
                {showManualScope ? (
                  <div className="rounded-sm border border-warning/35 bg-warning-soft px-3 py-2.5 text-[11px] leading-4 text-warning">
                    This identity cannot list projects. Enter the project ID and environment slug
                    from Infisical. The first secret request will verify them.
                  </div>
                ) : (
                  <>
                    <Field>
                      <FieldLabel htmlFor="project-select">Project</FieldLabel>
                      <Select
                        items={effectiveProjects.map((project) => ({
                          value: project.id,
                          label: project.name,
                        }))}
                        value={projectId}
                        onValueChange={(value) => chooseProject(String(value ?? ""))}
                      >
                        <SelectTrigger id="project-select" aria-label="Project">
                          <SelectValue placeholder="Choose a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {effectiveProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        {projectsQuery.isFetching
                          ? "Refreshing projects…"
                          : "Secret Manager projects only."}
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="environment-select">Environment</FieldLabel>
                      <Select
                        items={environments.map((env) => ({ value: env.slug, label: env.name }))}
                        value={environment}
                        onValueChange={(value) => setEnvironment(String(value ?? ""))}
                      >
                        <SelectTrigger id="environment-select" aria-label="Environment">
                          <SelectValue placeholder="Choose an environment" />
                        </SelectTrigger>
                        <SelectContent>
                          {environments.map((env) => (
                            <SelectItem key={env.id} value={env.slug}>
                              {env.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </>
                )}

                {showManualScope ? (
                  <div className="grid gap-4">
                    <Field>
                      <FieldLabel htmlFor="manual-project-id">Project ID</FieldLabel>
                      <Input
                        id="manual-project-id"
                        value={projectId}
                        onChange={(event) => setProjectId(event.target.value)}
                        placeholder="Project ID from Infisical"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="manual-environment">Environment slug</FieldLabel>
                      <Input
                        id="manual-environment"
                        value={environment}
                        onChange={(event) => setEnvironment(event.target.value)}
                        placeholder="dev"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </Field>
                  </div>
                ) : null}

                <Field>
                  <FieldLabel htmlFor="secret-path">Folder path</FieldLabel>
                  <Input
                    id="secret-path"
                    value={secretPath}
                    onChange={(event) => setSecretPath(event.target.value)}
                    placeholder="/"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                  />
                  <FieldDescription>Use `/` for the project root.</FieldDescription>
                </Field>

                {scopeError || projectsQuery.error ? (
                  <ErrorBanner
                    message={
                      scopeError ??
                      (projectsQuery.error instanceof Error
                        ? projectsQuery.error.message
                        : "Could not load projects.")
                    }
                  />
                ) : null}

                <div className="flex items-center gap-2">
                  {!initialStatus ? (
                    <Button type="button" variant="ghost" onClick={() => setStep("connect")}>
                      Back
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1 justify-between"
                    onClick={confirmScope}
                  >
                    <span>Continue</span>
                    <Icon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </div>

                {manualScope ? (
                  <button
                    type="button"
                    className="text-left text-[11px] text-muted underline underline-offset-2 hover:text-ink"
                    onClick={() => {
                      setManualScope(false);
                      void projectsQuery.refetch();
                    }}
                  >
                    Try listing projects again
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          {step === "ready" && readyStatus ? (
            <section className="animate-fade-in">
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-semibold tracking-[-0.03em]">Ready to work</h1>
                <Badge tone="success">Connected</Badge>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted">
                The workspace is scoped and the session is live. Secret values will only be fetched
                when you ask for them.
              </p>

              <dl className="mt-6 divide-y divide-line rounded-sm border border-line bg-surface-raised">
                {[
                  { label: "Instance", value: readyStatus.baseUrl, icon: GlobeIcon },
                  {
                    label: "Project",
                    value: readyProject?.name ?? readyStatus.projectId ?? "Manual scope",
                    icon: Folder01Icon,
                  },
                  { label: "Environment", value: readyStatus.environment ?? "—", icon: Key01Icon },
                  { label: "Path", value: readyStatus.secretPath, icon: LockKeyIcon },
                  {
                    label: "Credentials",
                    value: rememberSummary(readyStatus.rememberCredentials),
                    icon: Shield01Icon,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-3 py-2.5">
                    <Icon icon={item.icon} size={14} className="text-muted" />
                    <dt className="w-24 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                      {item.label}
                    </dt>
                    <dd className="min-w-0 truncate font-mono text-[11px] text-ink">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <Button
                type="button"
                variant="primary"
                className="mt-6 w-full justify-between"
                onClick={() => onComplete(readyStatus)}
              >
                <span>Open workspace</span>
                <span className="flex items-center gap-1.5">
                  <Kbd className="border-accent-ink/20 bg-accent-ink/10 text-accent-ink">N</Kbd>
                  <Icon icon={ArrowRight01Icon} size={16} />
                </span>
              </Button>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
