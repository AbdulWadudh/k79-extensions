import { describe, expect, it } from "vitest";
import { createApiError, normalizeThrownError } from "@/api/errors";

describe("Infisical error mapping", () => {
  it("maps authentication and authorization failures", () => {
    expect(createApiError(401, {}).code).toBe("unauthorized");
    expect(createApiError(403, {}).code).toBe("forbidden");
    expect(createApiError(404, {}).code).toBe("not_found");
  });

  it("keeps rate-limit guidance", () => {
    const error = createApiError(429, {}, "12");
    expect(error.code).toBe("rate_limited");
    expect(error.message).toContain("12 seconds");
  });

  it("uses server validation messages when available", () => {
    const error = createApiError(422, { message: "Secret key already exists" });
    expect(error.code).toBe("validation");
    expect(error.message).toBe("Secret key already exists");
  });

  it("normalizes network and timeout failures", () => {
    expect(normalizeThrownError(new TypeError("fetch failed")).code).toBe("network");
    expect(normalizeThrownError(new DOMException("timeout", "TimeoutError")).code).toBe("network");
    expect(normalizeThrownError(new Error("boom")).code).toBe("unknown");
    expect(normalizeThrownError("boom").code).toBe("unknown");
  });

  it("maps server, validation, and unknown statuses", () => {
    expect(createApiError(500, { message: "server down" })).toMatchObject({
      code: "server",
      message: "server down",
    });
    expect(createApiError(500, {}).message).toContain("unexpected");
    expect(createApiError(400, {}).code).toBe("validation");
    expect(createApiError(418, {}).code).toBe("unknown");
  });
});
