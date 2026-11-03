export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "validation"
  | "network"
  | "server"
  | "unknown";

export class InfisicalError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message);
    this.name = "InfisicalError";
    this.code = code;
    this.status = status;
  }
}

function messageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message;
  if (typeof record.error === "string" && record.error.trim()) return record.error;
  return undefined;
}

export function createApiError(
  status: number,
  body: unknown,
  retryAfter?: string | null,
): InfisicalError {
  const serverMessage = messageFromBody(body);

  if (status === 401) {
    return new InfisicalError(
      "unauthorized",
      "Your Infisical session expired. Reconnect to continue.",
      status,
    );
  }

  if (status === 403) {
    return new InfisicalError(
      "forbidden",
      "This Machine Identity does not have permission for that action.",
      status,
    );
  }

  if (status === 404) {
    return new InfisicalError(
      "not_found",
      "The secret or scope was not found in Infisical.",
      status,
    );
  }

  if (status === 429) {
    const wait = retryAfter ? ` Try again in ${retryAfter} seconds.` : " Try again shortly.";
    return new InfisicalError(
      "rate_limited",
      `Infisical is rate limiting requests.${wait}`,
      status,
    );
  }

  if (status === 400 || status === 422) {
    return new InfisicalError(
      "validation",
      serverMessage ?? "Infisical rejected the request. Check the key, path, and value.",
      status,
    );
  }

  if (status >= 500) {
    return new InfisicalError(
      "server",
      serverMessage ?? "Infisical returned an unexpected error.",
      status,
    );
  }

  return new InfisicalError(
    "unknown",
    serverMessage ?? `Infisical request failed with status ${status}.`,
    status,
  );
}

export function normalizeThrownError(error: unknown): InfisicalError {
  if (error instanceof InfisicalError) return error;
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return new InfisicalError("network", "Infisical did not respond in time. Try again.");
  }
  if (error instanceof TypeError) {
    return new InfisicalError(
      "network",
      "Could not reach Infisical. Check your connection and instance URL.",
    );
  }
  if (error instanceof Error && error.message) {
    return new InfisicalError("unknown", error.message);
  }
  return new InfisicalError("unknown", "An unexpected error occurred.");
}
