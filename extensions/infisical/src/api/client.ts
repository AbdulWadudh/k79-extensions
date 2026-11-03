import { createApiError, InfisicalError, normalizeThrownError } from "./errors";
import {
  approvalResponseSchema,
  authResponseSchema,
  type MutationResult,
  type Project,
  projectListResponseSchema,
  type SecretDetail,
  type SecretScope,
  type SecretSummary,
  secretListResponseSchema,
  secretResponseSchema,
  toSecretDetail,
  toSecretSummary,
} from "./types";

export const DEFAULT_BASE_URL = "https://us.infisical.com";
export const EU_BASE_URL = "https://eu.infisical.com";

const REQUEST_TIMEOUT_MS = 20_000;

type QueryValue = string | number | boolean | undefined;
type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
};

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new InfisicalError("validation", "Enter your Infisical instance URL.");

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new InfisicalError("validation", "That Infisical URL is not valid.");
  }

  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost(url.hostname))) {
    throw new InfisicalError(
      "validation",
      "Use HTTPS for Infisical, except on localhost during development.",
    );
  }

  if (url.username || url.password) {
    throw new InfisicalError("validation", "Do not put credentials in the instance URL.");
  }

  return url.origin;
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(path, `${baseUrl.replace(/\/+$/, "")}/`);

  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers = new Headers();
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw normalizeThrownError(error);
  }

  const text = await response.text();
  let body: unknown;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw new InfisicalError("server", "Infisical returned an unreadable response.");
      }
    }
  }

  if (!response.ok) {
    throw createApiError(response.status, body, response.headers.get("Retry-After"));
  }

  return body as T;
}

export async function loginUniversalAuth(
  baseUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await requestJson(baseUrl, "/api/v1/auth/universal-auth/login", {
    method: "POST",
    body: { clientId, clientSecret },
  });

  return authResponseSchema.parse(response);
}

export async function listProjects(baseUrl: string, token: string): Promise<Project[]> {
  const response = await requestJson(baseUrl, "/api/v1/projects", {
    token,
    query: { type: "secret-manager" },
  });

  return projectListResponseSchema.parse(response).projects;
}

export async function listSecrets(
  baseUrl: string,
  token: string,
  scope: SecretScope,
): Promise<SecretSummary[]> {
  const response = await requestJson(baseUrl, "/api/v4/secrets", {
    token,
    query: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      viewSecretValue: "false",
      expandSecretReferences: "false",
      recursive: "false",
      includeImports: "false",
    },
  });

  return secretListResponseSchema.parse(response).secrets.map(toSecretSummary);
}

export async function getSecret(
  baseUrl: string,
  token: string,
  scope: SecretScope,
  name: string,
): Promise<SecretDetail> {
  const response = await requestJson(baseUrl, `/api/v4/secrets/${encodeURIComponent(name)}`, {
    token,
    query: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      viewSecretValue: "true",
      expandSecretReferences: "false",
      includeImports: "false",
    },
  });

  return toSecretDetail(secretResponseSchema.parse(response).secret);
}

function parseMutation(response: unknown): MutationResult {
  const approval = approvalResponseSchema.safeParse(response);
  if (approval.success) {
    return { status: "pending", message: "Change submitted for approval." };
  }

  const saved = secretResponseSchema.parse(response);
  return { status: "saved", secret: toSecretDetail(saved.secret) };
}

export async function createSecret(
  baseUrl: string,
  token: string,
  scope: SecretScope,
  input: { name: string; value: string; comment: string },
): Promise<MutationResult> {
  const response = await requestJson(baseUrl, `/api/v4/secrets/${encodeURIComponent(input.name)}`, {
    method: "POST",
    token,
    body: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      secretValue: input.value,
      secretComment: input.comment,
      type: "shared",
    },
  });

  return parseMutation(response);
}

export async function updateSecret(
  baseUrl: string,
  token: string,
  scope: SecretScope,
  input: { name: string; newName?: string; value: string; comment: string },
): Promise<MutationResult> {
  const response = await requestJson(baseUrl, `/api/v4/secrets/${encodeURIComponent(input.name)}`, {
    method: "PATCH",
    token,
    body: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      secretValue: input.value,
      secretComment: input.comment,
      type: "shared",
      ...(input.newName && input.newName !== input.name ? { newSecretName: input.newName } : {}),
    },
  });

  return parseMutation(response);
}

export async function deleteSecret(
  baseUrl: string,
  token: string,
  scope: SecretScope,
  name: string,
): Promise<MutationResult> {
  const response = await requestJson(baseUrl, `/api/v4/secrets/${encodeURIComponent(name)}`, {
    method: "DELETE",
    token,
    body: {
      projectId: scope.projectId,
      environment: scope.environment,
      secretPath: scope.secretPath,
      type: "shared",
    },
  });

  return parseMutation(response);
}
