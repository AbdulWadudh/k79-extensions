import { beforeEach, describe, expect, it, vi } from "vitest";
import { isInfisicalCloudOrigin, requestInstancePermission } from "@/lib/permissions";

const request = vi.fn();

beforeEach(() => {
  request.mockReset();
  request.mockResolvedValue(true);
  vi.stubGlobal("chrome", { permissions: { request } });
});

describe("optional host permissions", () => {
  it("recognizes cloud origins", () => {
    expect(isInfisicalCloudOrigin("https://us.infisical.com")).toBe(true);
    expect(isInfisicalCloudOrigin("https://eu.infisical.com")).toBe(true);
    expect(isInfisicalCloudOrigin("https://infisical.example.com")).toBe(false);
  });

  it("skips permission prompts for cloud origins", async () => {
    await requestInstancePermission("https://us.infisical.com");
    expect(request).not.toHaveBeenCalled();
  });

  it("requests the exact self-hosted origin", async () => {
    await requestInstancePermission("https://infisical.example.com/path");
    expect(request).toHaveBeenCalledWith({
      origins: ["https://infisical.example.com/*"],
    });
  });

  it("throws when the user denies the permission", async () => {
    request.mockResolvedValueOnce(false);
    await expect(requestInstancePermission("https://infisical.example.com")).rejects.toThrow(
      /blocked access/,
    );
  });
});
