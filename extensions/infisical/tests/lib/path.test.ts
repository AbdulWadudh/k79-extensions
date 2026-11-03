import { describe, expect, it } from "vitest";
import { normalizeSecretPath, parentSecretPath, tryNormalizeSecretPath } from "@/lib/path";

describe("secret paths", () => {
  it("normalizes missing and trailing slashes", () => {
    expect(tryNormalizeSecretPath("")).toBe("/");
    expect(tryNormalizeSecretPath("/")).toBe("/");
    expect(tryNormalizeSecretPath("payments/stripe")).toBe("/payments/stripe");
    expect(tryNormalizeSecretPath("/payments/stripe/")).toBe("/payments/stripe");
  });

  it("rejects traversal segments", () => {
    expect(tryNormalizeSecretPath("/payments/../prod")).toBeNull();
    expect(tryNormalizeSecretPath("./payments")).toBeNull();
    expect(() => normalizeSecretPath("/payments/../prod")).toThrow(/cannot contain/);
  });

  it("finds the parent path", () => {
    expect(parentSecretPath("/")).toBeNull();
    expect(parentSecretPath("/payments")).toBe("/");
    expect(parentSecretPath("/payments/stripe")).toBe("/payments");
  });
});
