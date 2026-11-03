import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSecret,
  deleteSecret,
  getSecret,
  listFolders,
  listProjects,
  listSecrets,
  loginUniversalAuth,
  normalizeBaseUrl,
  updateSecret,
} from "@/api/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeBaseUrl", () => {
  it("accepts cloud and self-hosted HTTPS origins", () => {
    expect(normalizeBaseUrl("https://us.infisical.com")).toBe("https://us.infisical.com");
    expect(normalizeBaseUrl("infisical.example.com")).toBe("https://infisical.example.com");
    expect(normalizeBaseUrl("https://infisical.example.com/path/")).toBe(
      "https://infisical.example.com",
    );
  });

  it("allows HTTP only on localhost", () => {
    expect(normalizeBaseUrl("http://localhost:8080")).toBe("http://localhost:8080");
    expect(() => normalizeBaseUrl("http://infisical.example.com")).toThrow(/HTTPS/);
  });

  it("rejects embedded credentials", () => {
    expect(() => normalizeBaseUrl("https://user:pass@infisical.example.com")).toThrow(
      /credentials/,
    );
  });

  it("rejects empty and invalid URLs", () => {
    expect(() => normalizeBaseUrl("")).toThrow(/Enter/);
    expect(() => normalizeBaseUrl("not a url")).toThrow(/not valid/);
  });
});

describe("Infisical client", () => {
  it("exchanges Universal Auth credentials for a token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ accessToken: "token-123", expiresIn: 3600, tokenType: "Bearer" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await loginUniversalAuth(
      "https://us.infisical.com",
      "client-id",
      "client-secret",
    );

    expect(result.accessToken).toBe("token-123");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://us.infisical.com/api/v1/auth/universal-auth/login");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ clientId: "client-id", clientSecret: "client-secret" }),
    );
  });

  it("lists folders for the current path", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        folders: [{ id: "folder-1", name: "LMS-BACKEND", relativePath: "/LMS-BACKEND" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const folders = await listFolders("https://us.infisical.com", "token", {
      projectId: "project-1",
      environment: "dev",
      secretPath: "/",
    });

    expect(folders).toEqual([{ id: "folder-1", name: "LMS-BACKEND", path: "/LMS-BACKEND" }]);
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/api/v2/folders");
    expect(url.searchParams.get("path")).toBe("/");
    expect(url.searchParams.get("recursive")).toBe("false");
  });

  it("lists secrets without requesting values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        secrets: [
          {
            id: "secret-1",
            secretKey: "STRIPE_KEY",
            secretComment: "billing",
            version: 4,
            secretPath: "/payments",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const secrets = await listSecrets("https://us.infisical.com", "token", {
      projectId: "project-1",
      environment: "dev",
      secretPath: "/payments",
    });

    expect(secrets).toEqual([
      {
        id: "secret-1",
        key: "STRIPE_KEY",
        path: "/payments",
        comment: "billing",
        version: 4,
        updatedAt: "2026-01-01T00:00:00.000Z",
        tags: [],
      },
    ]);
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get("viewSecretValue")).toBe("false");
    expect(url.searchParams.get("expandSecretReferences")).toBe("false");
    expect(url.searchParams.get("recursive")).toBe("false");
  });

  it("maps a 401 response to an unauthorized error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "expired" }, 401)));

    await expect(listProjects("https://us.infisical.com", "expired")).rejects.toMatchObject({
      code: "unauthorized",
      status: 401,
    });
  });

  it("maps rate limiting and server failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "slow down" }), {
          status: 429,
          headers: { "Retry-After": "7" },
        }),
      ),
    );
    await expect(listProjects("https://us.infisical.com", "token")).rejects.toMatchObject({
      code: "rate_limited",
      message: expect.stringContaining("7 seconds"),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "down" }), { status: 500 })),
    );
    await expect(listProjects("https://us.infisical.com", "token")).rejects.toMatchObject({
      code: "server",
    });
  });

  it("fetches a single value only when requested", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        secret: {
          id: "secret-1",
          secretKey: "STRIPE_KEY",
          secretValue: "synthetic-value",
          secretComment: "",
          version: 2,
          secretPath: "/payments",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const detail = await getSecret(
      "https://us.infisical.com",
      "token",
      { projectId: "project-1", environment: "dev", secretPath: "/payments" },
      "STRIPE_KEY",
    );

    expect(detail.value).toBe("synthetic-value");
    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.pathname).toBe("/api/v4/secrets/STRIPE_KEY");
    expect(url.searchParams.get("viewSecretValue")).toBe("true");
    expect(url.searchParams.get("expandSecretReferences")).toBe("false");
  });

  it("creates a secret with shared visibility", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        secret: {
          id: "secret-1",
          secretKey: "NEW_KEY",
          secretValue: "synthetic-value",
          secretComment: "note",
          version: 1,
          secretPath: "/",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createSecret(
      "https://us.infisical.com",
      "token",
      { projectId: "project-1", environment: "dev", secretPath: "/" },
      { name: "NEW_KEY", value: "synthetic-value", comment: "note" },
    );

    expect(result.status).toBe("saved");
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({
      projectId: "project-1",
      environment: "dev",
      secretValue: "synthetic-value",
      type: "shared",
    });
  });

  it("reports an approval response as pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ approval: { id: "approval-1", status: "open" } })),
    );

    const result = await createSecret(
      "https://us.infisical.com",
      "token",
      { projectId: "project-1", environment: "dev", secretPath: "/" },
      { name: "NEW_KEY", value: "synthetic-value", comment: "" },
    );

    expect(result).toEqual({ status: "pending", message: "Change submitted for approval." });
  });

  it("sends newSecretName when renaming", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        secret: {
          id: "secret-1",
          secretKey: "NEW_NAME",
          secretValue: "synthetic-value",
          secretComment: "",
          version: 2,
          secretPath: "/",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateSecret(
      "https://us.infisical.com",
      "token",
      { projectId: "project-1", environment: "dev", secretPath: "/" },
      { name: "OLD_NAME", newName: "NEW_NAME", value: "synthetic-value", comment: "" },
    );

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      newSecretName: "NEW_NAME",
      secretValue: "synthetic-value",
    });
  });

  it("deletes with an explicit scope body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        secret: {
          id: "secret-1",
          secretKey: "OLD_KEY",
          secretValue: "",
          secretComment: "",
          version: 3,
          secretPath: "/",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await deleteSecret(
      "https://us.infisical.com",
      "token",
      { projectId: "project-1", environment: "dev", secretPath: "/" },
      "OLD_KEY",
    );

    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toMatchObject({ projectId: "project-1", type: "shared" });
  });
});
