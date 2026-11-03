import { listProjects, loginUniversalAuth, normalizeBaseUrl } from "../api/client";
import { InfisicalError, normalizeThrownError } from "../api/errors";
import type { Project } from "../api/types";
import type { ConnectInput, ConnectionStatus } from "../messaging/protocol";
import {
  clearConnection,
  getCredentials,
  getPrefs,
  getSession,
  saveCredentials,
  savePrefs,
  saveSession,
  setRemember,
  type UniversalCredentials,
} from "./storage";

type AuthToken = { accessToken: string; expiresAt: number };

let loginPromise: Promise<AuthToken> | null = null;

function isExpired(expiresAt: number | undefined): boolean {
  return !expiresAt || expiresAt < Date.now() + 60_000;
}

async function login(force: boolean): Promise<AuthToken> {
  const session = await getSession();

  if (!force && session.accessToken && !isExpired(session.expiresAt)) {
    return { accessToken: session.accessToken, expiresAt: session.expiresAt ?? 0 };
  }

  if (loginPromise) return loginPromise;

  loginPromise = (async () => {
    const credentials = await getCredentials();
    if (!credentials) {
      throw new InfisicalError("unauthorized", "Connect a Machine Identity to continue.");
    }

    const prefs = await getPrefs();
    const auth = await loginUniversalAuth(
      prefs.baseUrl,
      credentials.clientId,
      credentials.clientSecret,
    );
    const token: AuthToken = {
      accessToken: auth.accessToken,
      expiresAt: Date.now() + auth.expiresIn * 1000,
    };
    await saveSession({ accessToken: token.accessToken, expiresAt: token.expiresAt });
    return token;
  })().finally(() => {
    loginPromise = null;
  });

  return loginPromise;
}

export async function getAccessToken(force = false): Promise<string> {
  return (await login(force)).accessToken;
}

export async function withAuthRetry<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  try {
    return await fn(token);
  } catch (error) {
    if (error instanceof InfisicalError && error.code === "unauthorized") {
      const fresh = await getAccessToken(true);
      return fn(fresh);
    }
    throw error;
  }
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const prefs = await getPrefs();
  const credentials = await getCredentials();

  return {
    connected: credentials !== null,
    hasCredentials: credentials !== null,
    baseUrl: prefs.baseUrl,
    projectId: prefs.projectId,
    environment: prefs.environment,
    secretPath: prefs.secretPath,
    rememberCredentials: prefs.rememberCredentials,
    theme: prefs.theme,
    canListProjects: prefs.canListProjects,
    recentPaths: prefs.recentPaths,
    recentSecrets: prefs.recentSecrets,
  };
}

export async function connect(
  input: ConnectInput,
): Promise<{ status: ConnectionStatus; projects: Project[]; canListProjects: boolean }> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  const credentials: UniversalCredentials = {
    clientId: input.clientId.trim(),
    clientSecret: input.clientSecret,
  };

  const auth = await loginUniversalAuth(baseUrl, credentials.clientId, credentials.clientSecret);
  await savePrefs({ baseUrl, rememberCredentials: input.rememberCredentials });
  await saveCredentials(credentials, input.rememberCredentials);
  await saveSession({
    accessToken: auth.accessToken,
    expiresAt: Date.now() + auth.expiresIn * 1000,
    ...(input.rememberCredentials ? {} : { credentials }),
  });

  let projects: Project[] = [];
  let canListProjects = true;

  try {
    projects = await listProjects(baseUrl, auth.accessToken);
    await savePrefs({ canListProjects: true });
  } catch (error) {
    const normalized = normalizeThrownError(error);
    if (normalized.code !== "forbidden") throw normalized;
    canListProjects = false;
    await savePrefs({ canListProjects: false });
  }

  return {
    status: await getConnectionStatus(),
    projects,
    canListProjects,
  };
}

export async function disconnect(): Promise<ConnectionStatus> {
  await clearConnection();
  return getConnectionStatus();
}

export async function updateRemember(remember: boolean): Promise<ConnectionStatus> {
  await setRemember(remember);
  return getConnectionStatus();
}
