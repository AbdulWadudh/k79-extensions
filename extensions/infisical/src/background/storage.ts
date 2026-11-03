import { z } from "zod";
import { normalizeSecretPath } from "../lib/path";
import type { ThemePreference } from "../messaging/protocol";

const PREFS_KEY = "k79.infisical.prefs.v1";
const CREDENTIALS_KEY = "k79.infisical.credentials.v1";
const SESSION_KEY = "k79.infisical.session.v1";

const recentSecretSchema = z.object({
  key: z.string(),
  path: z.string(),
});

export const prefsSchema = z.object({
  baseUrl: z.string(),
  projectId: z.string().optional(),
  environment: z.string().optional(),
  secretPath: z.string().default("/"),
  rememberCredentials: z.boolean().default(false),
  theme: z.enum(["system", "light", "dark"]).default("system"),
  canListProjects: z.boolean().default(true),
  recentPaths: z.array(z.string()).default(["/"]),
  recentSecrets: z.array(recentSecretSchema).default([]),
});

export type Prefs = z.infer<typeof prefsSchema>;

const credentialsSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
});

export type UniversalCredentials = z.infer<typeof credentialsSchema>;

const sessionSchema = z.object({
  accessToken: z.string().optional(),
  expiresAt: z.number().optional(),
  credentials: credentialsSchema.optional(),
});

export type SessionState = z.infer<typeof sessionSchema>;

export const defaultPrefs: Prefs = {
  baseUrl: "https://us.infisical.com",
  secretPath: "/",
  rememberCredentials: false,
  theme: "system",
  canListProjects: true,
  recentPaths: ["/"],
  recentSecrets: [],
};

async function readLocal(key: string): Promise<unknown> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

async function readSession(key: string): Promise<unknown> {
  const result = await chrome.storage.session.get(key);
  return result[key];
}

export async function getPrefs(): Promise<Prefs> {
  const parsed = prefsSchema.safeParse(await readLocal(PREFS_KEY));
  if (!parsed.success) return { ...defaultPrefs };
  return {
    ...defaultPrefs,
    ...parsed.data,
    secretPath: normalizeSecretPath(parsed.data.secretPath),
  };
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const current = await getPrefs();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ [PREFS_KEY]: next });
  return next;
}

export async function clearScope(): Promise<Prefs> {
  const current = await getPrefs();
  const { projectId: _projectId, environment: _environment, ...rest } = current;
  const next = { ...rest, secretPath: "/" };
  await chrome.storage.local.set({ [PREFS_KEY]: next });
  return next;
}

export async function saveScope(scope: {
  projectId: string;
  environment: string;
  secretPath: string;
}): Promise<Prefs> {
  const current = await getPrefs();
  const normalizedPath = normalizeSecretPath(scope.secretPath);
  const recentPaths = [
    normalizedPath,
    ...current.recentPaths.filter((path) => path !== normalizedPath),
  ].slice(0, 6);
  const next: Prefs = {
    ...current,
    projectId: scope.projectId,
    environment: scope.environment,
    secretPath: normalizedPath,
    recentPaths,
  };
  await chrome.storage.local.set({ [PREFS_KEY]: next });
  return next;
}

export async function addRecentSecret(key: string, path: string): Promise<void> {
  const current = await getPrefs();
  const next = [
    { key, path },
    ...current.recentSecrets.filter((entry) => !(entry.key === key && entry.path === path)),
  ].slice(0, 8);
  await savePrefs({ recentSecrets: next });
}

export async function getSession(): Promise<SessionState> {
  const parsed = sessionSchema.safeParse(await readSession(SESSION_KEY));
  return parsed.success ? parsed.data : {};
}

export async function saveSession(patch: SessionState): Promise<SessionState> {
  const next = { ...(await getSession()), ...patch };
  await chrome.storage.session.set({ [SESSION_KEY]: next });
  return next;
}

export async function getCredentials(): Promise<UniversalCredentials | null> {
  const session = await getSession();
  if (session.credentials) return session.credentials;

  const parsed = credentialsSchema.safeParse(await readLocal(CREDENTIALS_KEY));
  return parsed.success ? parsed.data : null;
}

export async function saveCredentials(
  credentials: UniversalCredentials,
  remember: boolean,
): Promise<void> {
  if (remember) {
    await chrome.storage.local.set({ [CREDENTIALS_KEY]: credentials });
    const session = await getSession();
    const { credentials: _old, ...rest } = session;
    await chrome.storage.session.set({ [SESSION_KEY]: rest });
    return;
  }

  await chrome.storage.local.remove(CREDENTIALS_KEY);
  await saveSession({ credentials });
}

export async function setRemember(remember: boolean): Promise<Prefs> {
  const prefs = await savePrefs({ rememberCredentials: remember });
  const credentials = await getCredentials();
  if (credentials) await saveCredentials(credentials, remember);
  return prefs;
}

export async function clearConnection(): Promise<Prefs> {
  const current = await getPrefs();
  const reset: Prefs = {
    ...defaultPrefs,
    baseUrl: current.baseUrl,
    theme: current.theme,
  };
  await chrome.storage.local.set({ [PREFS_KEY]: reset });
  await chrome.storage.local.remove(CREDENTIALS_KEY);
  await chrome.storage.session.remove(SESSION_KEY);
  return reset;
}

export function isThemePreference(value: string): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}
