import { beforeEach, describe, expect, it, vi } from "vitest";
import { InfisicalError } from "@/api/errors";
import type { ConnectionStatus, RpcRequest } from "@/messaging/protocol";

vi.mock("@/background/auth", () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getConnectionStatus: vi.fn(),
  updateRemember: vi.fn(),
  withAuthRetry: vi.fn(),
}));

vi.mock("@/background/storage", () => ({
  addRecentSecret: vi.fn(),
  getPrefs: vi.fn(),
  savePrefs: vi.fn(),
  saveScope: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  createSecret: vi.fn(),
  deleteSecret: vi.fn(),
  getSecret: vi.fn(),
  listProjects: vi.fn(),
  listSecrets: vi.fn(),
  updateSecret: vi.fn(),
}));

import { createSecret, deleteSecret, listProjects, listSecrets, updateSecret } from "@/api/client";
import {
  connect,
  disconnect,
  getConnectionStatus,
  updateRemember,
  withAuthRetry,
} from "@/background/auth";
import { handleMessage } from "@/background/handlers";
import { addRecentSecret, getPrefs, savePrefs, saveScope } from "@/background/storage";

const status: ConnectionStatus = {
  connected: true,
  hasCredentials: true,
  baseUrl: "https://us.infisical.com",
  projectId: "project-1",
  environment: "dev",
  secretPath: "/",
  rememberCredentials: false,
  theme: "system",
  canListProjects: true,
  recentPaths: ["/"],
  recentSecrets: [],
};

const scope = { projectId: "project-1", environment: "dev", secretPath: "/" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPrefs).mockResolvedValue({
    baseUrl: "https://us.infisical.com",
    projectId: "project-1",
    environment: "dev",
    secretPath: "/",
    rememberCredentials: false,
    theme: "system",
    canListProjects: true,
    recentPaths: ["/"],
    recentSecrets: [],
  });
  vi.mocked(getConnectionStatus).mockResolvedValue(status);
  vi.mocked(withAuthRetry).mockImplementation(async (fn) => fn("token"));
  vi.mocked(savePrefs).mockResolvedValue(status as never);
  vi.mocked(saveScope).mockResolvedValue(status as never);
});

describe("background RPC dispatcher", () => {
  it("rejects malformed requests", async () => {
    const result = await handleMessage({ type: "not-a-request" });
    expect(result).toEqual({
      ok: false,
      error: { code: "validation", message: "The extension sent an invalid request." },
    });
  });

  it("returns connection status", async () => {
    const result = await handleMessage({ type: "connection.status" } satisfies RpcRequest);
    expect(result).toEqual({ ok: true, data: status });
  });

  it("lists secrets without exposing values", async () => {
    vi.mocked(listSecrets).mockResolvedValue([
      {
        id: "secret-1",
        key: "KEY",
        path: "/",
        comment: "",
        version: 1,
        tags: [],
      },
    ]);

    const result = await handleMessage({
      type: "secrets.list",
      payload: { scope },
    } satisfies RpcRequest);

    expect(result.ok).toBe(true);
    expect(listSecrets).toHaveBeenCalledWith("https://us.infisical.com", "token", scope);
  });

  it("records a recent key after revealing one secret", async () => {
    vi.mocked(listSecrets).mockResolvedValue([]);
    const secret = {
      id: "secret-1",
      key: "KEY",
      path: "/",
      comment: "",
      version: 1,
      value: "synthetic",
      tags: [],
    };
    const { getSecret } = await import("@/api/client");
    vi.mocked(getSecret).mockResolvedValue(secret);

    const result = await handleMessage({
      type: "secrets.get",
      payload: { scope, name: "KEY" },
    } satisfies RpcRequest);

    expect(result).toEqual({ ok: true, data: secret });
    expect(addRecentSecret).toHaveBeenCalledWith("KEY", "/");
  });

  it("marks project listing as unavailable on 403", async () => {
    vi.mocked(listProjects).mockRejectedValue(new InfisicalError("forbidden", "forbidden"));

    const result = await handleMessage({ type: "projects.list" } satisfies RpcRequest);

    expect(result.ok).toBe(false);
    expect(savePrefs).toHaveBeenCalledWith({ canListProjects: false });
  });

  it("persists a new scope", async () => {
    const result = await handleMessage({
      type: "scope.set",
      payload: { scope },
    } satisfies RpcRequest);

    expect(result).toEqual({ ok: true, data: status });
    expect(saveScope).toHaveBeenCalledWith(scope);
    expect(getConnectionStatus).toHaveBeenCalled();
  });

  it("forwards connection lifecycle requests", async () => {
    vi.mocked(connect).mockResolvedValue({ status, projects: [], canListProjects: true });
    vi.mocked(disconnect).mockResolvedValue(status);
    vi.mocked(updateRemember).mockResolvedValue(status);

    const connectInput = {
      baseUrl: "https://us.infisical.com",
      clientId: "id",
      clientSecret: "secret",
      rememberCredentials: false,
    };
    await expect(
      handleMessage({ type: "connection.connect", payload: connectInput } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: { status, projects: [], canListProjects: true } });
    await expect(
      handleMessage({ type: "connection.disconnect" } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: status });
    await expect(
      handleMessage({
        type: "connection.setRemember",
        payload: { remember: true },
      } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: status });
  });

  it("persists theme changes", async () => {
    const result = await handleMessage({
      type: "prefs.setTheme",
      payload: { theme: "dark" },
    } satisfies RpcRequest);

    expect(result).toEqual({ ok: true, data: status });
    expect(savePrefs).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("forwards secret mutations", async () => {
    const mutation = {
      status: "saved" as const,
      secret: {
        id: "secret-1",
        key: "KEY",
        path: "/",
        comment: "",
        version: 1,
        value: "synthetic",
        tags: [],
      },
    };
    vi.mocked(createSecret).mockResolvedValue(mutation);
    vi.mocked(updateSecret).mockResolvedValue(mutation);
    vi.mocked(deleteSecret).mockResolvedValue(mutation);

    const input = { name: "KEY", value: "synthetic", comment: "" };
    await expect(
      handleMessage({
        type: "secrets.create",
        payload: { scope, input },
      } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: mutation });
    await expect(
      handleMessage({
        type: "secrets.update",
        payload: { scope, name: "KEY", input: { ...input, newName: "KEY_2" } },
      } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: mutation });
    await expect(
      handleMessage({
        type: "secrets.delete",
        payload: { scope, name: "KEY" },
      } satisfies RpcRequest),
    ).resolves.toEqual({ ok: true, data: mutation });
  });
});
