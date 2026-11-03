import {
  ArrowLeft01Icon,
  Cancel01Icon,
  ComputerIcon,
  Logout01Icon,
  Moon02Icon,
  Shield01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { Badge, Button, cn, IconButton, Switch } from "@k79/ui";
import { type ReactNode, useState } from "react";
import { ErrorBanner } from "@/components/error-banner";
import { Icon } from "@/components/icon";
import { useDisconnect, useSetRemember, useSetTheme } from "@/features/connection/queries";
import type { ConnectionStatus, ThemePreference } from "@/messaging/protocol";

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-ink">{title}</div>
        {description ? (
          <p className="mt-0.5 text-[11px] leading-4 text-muted">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const themes: Array<{ value: ThemePreference; label: string; icon: typeof ComputerIcon }> = [
  { value: "system", label: "System", icon: ComputerIcon },
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
];

export function SettingsPanel({
  status,
  onClose,
}: {
  status: ConnectionStatus;
  onClose: () => void;
}) {
  const setTheme = useSetTheme();
  const setRemember = useSetRemember();
  const disconnect = useDisconnect();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleRemember(remember: boolean) {
    setError(null);
    try {
      await setRemember.mutateAsync(remember);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not update this setting.");
    }
  }

  async function chooseTheme(theme: ThemePreference) {
    setError(null);
    try {
      await setTheme.mutateAsync(theme);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not update the theme.");
    }
  }

  async function disconnectNow() {
    setError(null);
    try {
      await disconnect.mutateAsync();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not disconnect.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-2">
        <IconButton label="Back to workspace" onClick={onClose} className="min-[700px]:hidden">
          <Icon icon={ArrowLeft01Icon} size={15} />
        </IconButton>
        <span className="text-[12px] font-semibold">Settings</span>
        <span className="ml-auto" />
        <IconButton label="Close settings" onClick={onClose}>
          <Icon icon={Cancel01Icon} size={15} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <section>
          <h2 className="text-[15px] font-semibold tracking-tight">Connection</h2>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            This extension is connected to one Machine Identity and one active scope.
          </p>
          <dl className="mt-3 divide-y divide-line rounded-sm border border-line bg-surface-raised">
            {[
              ["Instance", status.baseUrl],
              ["Project", status.projectId ?? "—"],
              ["Environment", status.environment ?? "—"],
              ["Path", status.secretPath],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2.5">
                <dt className="w-24 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                  {label}
                </dt>
                <dd className="min-w-0 truncate font-mono text-[11px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Security</h2>
          <div className="mt-2 rounded-sm border border-line bg-surface-raised px-3">
            <SettingRow
              title="Remember credentials"
              description="Store the Client ID and Secret unencrypted in this browser profile. When off, they last for this browser session."
            >
              <Switch
                checked={status.rememberCredentials}
                onCheckedChange={toggleRemember}
                disabled={setRemember.isPending}
                aria-label="Remember credentials on this device"
              />
            </SettingRow>
            <SettingRow
              title="Secret values"
              description="Values are fetched on demand and held in memory only. Closing the panel discards them."
            >
              <Badge tone="accent">Memory only</Badge>
            </SettingRow>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Appearance</h2>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-sm border border-line bg-surface-muted p-1">
            {themes.map((theme) => (
              <button
                key={theme.value}
                type="button"
                aria-pressed={status.theme === theme.value}
                onClick={() => chooseTheme(theme.value)}
                disabled={setTheme.isPending}
                className={cn(
                  "flex h-8 items-center justify-center gap-1.5 rounded-xs text-[11px] font-medium transition-colors",
                  status.theme === theme.value
                    ? "bg-surface-raised text-ink shadow-sm"
                    : "text-muted hover:text-ink",
                )}
              >
                <Icon icon={theme.icon} size={13} />
                {theme.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-semibold tracking-tight">Session</h2>
          <div className="mt-2 flex items-start gap-2 rounded-sm border border-line bg-surface-raised px-3 py-3">
            <Icon icon={Shield01Icon} size={16} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-[11px] leading-4 text-muted">
              Disconnecting clears the stored credentials, access token, recent keys, and cached
              values from this extension.
            </p>
          </div>

          {showDisconnectConfirm ? (
            <div className="mt-3 rounded-sm border border-danger/30 bg-danger-soft p-3">
              <p className="text-[11px] font-medium text-danger">Disconnect this identity?</p>
              <p className="mt-1 text-[11px] leading-4 text-danger/90">
                You will need the Client ID and Secret to reconnect.
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisconnectConfirm(false)}
                  disabled={disconnect.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={disconnectNow}
                  loading={disconnect.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full justify-center"
              onClick={() => setShowDisconnectConfirm(true)}
            >
              <Icon icon={Logout01Icon} size={14} />
              Disconnect
            </Button>
          )}
        </section>

        {error ? <ErrorBanner className="mt-4" message={error} /> : null}

        <p className="mt-8 border-t border-line pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          Infisical Console · K79 Extensions · v0.1.0
        </p>
      </div>
    </div>
  );
}
