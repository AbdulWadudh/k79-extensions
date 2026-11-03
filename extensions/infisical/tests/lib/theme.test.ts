import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme } from "@/lib/theme";

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.className = "";
});

describe("theme application", () => {
  it("applies explicit light and dark modes", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the system preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
