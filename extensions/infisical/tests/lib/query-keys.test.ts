import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/query-keys";

describe("query keys", () => {
  it("scopes secret queries by project, environment, path, mode, and name", () => {
    const scope = { projectId: "p1", environment: "dev", secretPath: "/payments" };
    expect(queryKeys.secrets(scope)).toEqual(["secrets", "p1", "dev", "/payments", false]);
    expect(queryKeys.secrets(scope, true)).toEqual(["secrets", "p1", "dev", "/payments", true]);
    expect(queryKeys.secretScope(scope)).toEqual(["secrets", "p1", "dev", "/payments"]);
    expect(queryKeys.secret(scope, "STRIPE_KEY")).toEqual([
      "secret",
      "p1",
      "dev",
      "/payments",
      "STRIPE_KEY",
    ]);
  });

  it("separates recursive folder results from the current folder", () => {
    const scope = { projectId: "p1", environment: "dev", secretPath: "/payments" };
    expect(queryKeys.folders(scope)).toEqual(["folders", "p1", "dev", "/payments", false]);
    expect(queryKeys.folders(scope, true)).toEqual(["folders", "p1", "dev", "/payments", true]);
  });
});
