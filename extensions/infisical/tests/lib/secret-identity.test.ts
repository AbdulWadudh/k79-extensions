import { describe, expect, it } from "vitest";
import { secretIdentity } from "@/lib/secret-identity";

describe("secret identity", () => {
  it("scopes a key to its own folder", () => {
    expect(secretIdentity({ path: "/", key: "API_KEY" })).not.toBe(
      secretIdentity({ path: "/LMS-BACKEND", key: "API_KEY" }),
    );
  });

  it("is stable for the same path and key", () => {
    expect(secretIdentity({ path: "/LMS-BACKEND", key: "API_KEY" })).toBe(
      secretIdentity({ path: "/LMS-BACKEND", key: "API_KEY" }),
    );
  });
});
