import { describe, expect, it } from "vitest";
import { normalizeSecretKeyInput } from "@/lib/secret-key";

describe("secret key input", () => {
  it("uppercases typed and pasted keys", () => {
    expect(normalizeSecretKeyInput("stripe_secret_key")).toBe("STRIPE_SECRET_KEY");
    expect(normalizeSecretKeyInput("Mixed-Case_Key")).toBe("MIXED-CASE_KEY");
    expect(normalizeSecretKeyInput("ALREADY_UPPER")).toBe("ALREADY_UPPER");
  });
});
