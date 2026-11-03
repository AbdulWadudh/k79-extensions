import { describe, expect, it } from "vitest";
import { environmentDotClass, environmentTone, environmentToneClass } from "@/lib/environment";

describe("environment tone", () => {
  it("classifies common environment names", () => {
    expect(environmentTone("dev")).toBe("dev");
    expect(environmentTone("development")).toBe("dev");
    expect(environmentTone("staging")).toBe("staging");
    expect(environmentTone("qa")).toBe("staging");
    expect(environmentTone("prod")).toBe("prod");
    expect(environmentTone("production")).toBe("prod");
    expect(environmentTone("custom")).toBe("neutral");
  });

  it("maps tones to token classes", () => {
    expect(environmentToneClass("dev")).toContain("text-env-dev");
    expect(environmentToneClass("staging")).toContain("text-env-staging");
    expect(environmentToneClass("prod")).toContain("text-env-prod");
    expect(environmentDotClass("prod")).toBe("bg-env-prod");
  });
});
