import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/query-keys";

describe("query keys", () => {
  it("scopes secret queries by project, environment, path, and name", () => {
    const scope = { projectId: "p1", environment: "dev", secretPath: "/payments" };
    expect(queryKeys.secrets(scope)).toEqual(["secrets", "p1", "dev", "/payments"]);
    expect(queryKeys.secret(scope, "STRIPE_KEY")).toEqual([
      "secret",
      "p1",
      "dev",
      "/payments",
      "STRIPE_KEY",
    ]);
  });
});
