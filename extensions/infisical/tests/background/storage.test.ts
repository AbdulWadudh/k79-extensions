import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentSecret,
  clearConnection,
  clearScope,
  getCredentials,
  getPrefs,
  getSession,
  isThemePreference,
  saveCredentials,
  savePrefs,
  saveScope,
  saveSession,
  setRemember,
} from "@/background/storage";

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

beforeEach(() => {
  for (const key of Object.keys(local)) delete local[key];
  for (const key of Object.keys(session)) delete session[key];
  vi.stubGlobal("chrome", {
    storage: {
      local: area(local),
      session: area(session),
    },
  });
});

describe("extension storage policy", () => {
  it("returns safe defaults before setup", async () => {
    const prefs = await getPrefs();
    expect(prefs.baseUrl).toBe("https://us.infisical.com");
    expect(prefs.secretPath).toBe("/");
    expect(prefs.rememberCredentials).toBe(false);
    expect(await getCredentials()).toBeNull();
  });

  it("normalizes and remembers the selected scope", async () => {
    const prefs = await saveScope({
      projectId: "project-1",
      environment: "dev",
      secretPath: "payments/stripe/",
    });

    expect(prefs.projectId).toBe("project-1");
    expect(prefs.secretPath).toBe("/payments/stripe");
    expect(prefs.recentPaths[0]).toBe("/payments/stripe");
  });

  it("keeps credentials in session unless remember is enabled", async () => {
    const credentials = { clientId: "id", clientSecret: "secret" };

    await saveCredentials(credentials, false);
    expect(await getCredentials()).toEqual(credentials);
    expect(local["k79.infisical.credentials.v1"]).toBeUndefined();

    await saveCredentials(credentials, true);
    expect(await getCredentials()).toEqual(credentials);
    expect(local["k79.infisical.credentials.v1"]).toEqual(credentials);
  });

  it("clears tokens, credentials, and recents on disconnect", async () => {
    await saveCredentials({ clientId: "id", clientSecret: "secret" }, true);
    await saveSession({ accessToken: "token", expiresAt: Date.now() + 60_000 });
    await saveScope({ projectId: "project-1", environment: "dev", secretPath: "/payments" });

    const reset = await clearConnection();

    expect(reset.projectId).toBeUndefined();
    expect(reset.recentSecrets).toEqual([]);
    expect(await getCredentials()).toBeNull();
    expect(await getSession()).toEqual({});
  });

  it("updates preferences and recent keys without duplicates", async () => {
    await savePrefs({ theme: "dark" });
    await addRecentSecret("KEY", "/");
    await addRecentSecret("KEY", "/");
    await addRecentSecret("OTHER", "/payments");

    const prefs = await getPrefs();
    expect(prefs.theme).toBe("dark");
    expect(prefs.recentSecrets).toEqual([
      { key: "OTHER", path: "/payments" },
      { key: "KEY", path: "/" },
    ]);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
  });

  it("clears only the active scope", async () => {
    await saveScope({ projectId: "project-1", environment: "dev", secretPath: "/payments" });
    const prefs = await clearScope();

    expect(prefs.projectId).toBeUndefined();
    expect(prefs.environment).toBeUndefined();
    expect(prefs.secretPath).toBe("/");
  });

  it("moves remembered credentials between session and local storage", async () => {
    const credentials = { clientId: "id", clientSecret: "secret" };
    await saveCredentials(credentials, false);

    await setRemember(true);
    expect(local["k79.infisical.credentials.v1"]).toEqual(credentials);

    await setRemember(false);
    expect(local["k79.infisical.credentials.v1"]).toBeUndefined();
    expect(session["k79.infisical.session.v1"]).toMatchObject({ credentials });
  });
});
