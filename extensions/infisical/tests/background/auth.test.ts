import { beforeEach, describe, expect, it, vi } from "vitest";
import { InfisicalError } from "@/api/errors";
import type { Project } from "@/api/types";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    loginUniversalAuth: vi.fn(),
    listProjects: vi.fn(),
  };
});

import { listProjects, loginUniversalAuth } from "@/api/client";
import {
  connect,
  disconnect,
  getAccessToken,
  getConnectionStatus,
  withAuthRetry,
} from "@/background/auth";
import { getCredentials, getSession, saveCredentials } from "@/background/storage";

const local: Record<string, unknown> = {};
const session: Record<string, unknown> = {};

function area(store: Record<string, unknown>) {
  return {
    get: vi.fn(async (key: string) => ({ [key]: store[key] })),
    set: vi.fn(async (values: Record<string, unknown>) => {
      Object.assign(store, values);
    }),
    remove: vi.fn(async (key: string) => {
      delete store[key];
    }),
  };
}

const project: Project = {
  id: "project-1",
  name: "Test",
  slug: "test",
  environments: [{ id: "env-1", name: "Development", slug: "dev" }],
};

const loginMock = vi.mocked(loginUniversalAuth);
const projectsMock = vi.mocked(listProjects);

beforeEach(() => {
  for (const key of Object.keys(local)) delete local[key];
  for (const key of Object.keys(session)) delete session[key];
  vi.stubGlobal("chrome", {
    storage: {
      local: area(local),
      session: area(session),
    },
  });
  loginMock.mockReset();
  projectsMock.mockReset();
  loginMock.mockResolvedValue({ accessToken: "token-1", expiresIn: 3_600 });
  projectsMock.mockResolvedValue([project]);
});

describe("Universal Auth session", () => {
  it("connects, stores credentials, and returns projects", async () => {
    const result = await connect({
      baseUrl: "https://us.infisical.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      rememberCredentials: false,
    });

    expect(loginMock).toHaveBeenCalledWith(
      "https://us.infisical.com",
      "client-id",
      "client-secret",
    );
    expect(result.projects).toEqual([project]);
    expect(result.status.connected).toBe(true);
    expect(result.status.canListProjects).toBe(true);
    expect(await getCredentials()).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
    expect(local["k79.infisical.credentials.v1"]).toBeUndefined();
  });

  it("keeps the connection but exposes manual scope when listing is forbidden", async () => {
    projectsMock.mockRejectedValueOnce(
      new InfisicalError("forbidden", "This identity cannot list projects."),
    );

    const result = await connect({
      baseUrl: "https://us.infisical.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      rememberCredentials: true,
    });

    expect(result.projects).toEqual([]);
    expect(result.canListProjects).toBe(false);
    expect(result.status.canListProjects).toBe(false);
    expect(local["k79.infisical.credentials.v1"]).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
    });
  });

  it("re-authenticates once after a 401", async () => {
    await saveCredentials({ clientId: "client-id", clientSecret: "client-secret" }, false);
    loginMock
      .mockResolvedValueOnce({ accessToken: "expired-token", expiresIn: 3_600 })
      .mockResolvedValueOnce({ accessToken: "fresh-token", expiresIn: 3_600 });

    const operation = vi.fn(async (token: string) => {
      if (token === "expired-token") {
        throw new InfisicalError("unauthorized", "expired", 401);
      }
      return "ok";
    });

    await expect(withAuthRetry(operation)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
    expect(await getSession()).toMatchObject({ accessToken: "fresh-token" });
  });

  it("clears the session on disconnect", async () => {
    await connect({
      baseUrl: "https://us.infisical.com",
      clientId: "client-id",
      clientSecret: "client-secret",
      rememberCredentials: false,
    });

    await disconnect();

    const status = await getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(await getCredentials()).toBeNull();
    expect(await getSession()).toEqual({});
  });

  it("requires credentials before accessing a token", async () => {
    await expect(getAccessToken()).rejects.toMatchObject({ code: "unauthorized" });
  });

  it("rethrows non-authentication failures without retrying", async () => {
    await saveCredentials({ clientId: "client-id", clientSecret: "client-secret" }, false);
    loginMock.mockResolvedValueOnce({ accessToken: "token", expiresIn: 3_600 });
    const operation = vi.fn().mockRejectedValue(new InfisicalError("server", "down"));

    await expect(withAuthRetry(operation)).rejects.toMatchObject({ code: "server" });
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
