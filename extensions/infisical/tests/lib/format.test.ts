import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime, formatUpdatedAt } from "@/lib/format";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("formatting timestamps", () => {
  it("formats recent and older updates", () => {
    expect(formatRelativeTime("2026-01-01T11:58:00.000Z")).toBe("2 minutes ago");
    expect(formatRelativeTime("2025-12-30T12:00:00.000Z")).toBe("2 days ago");
    expect(formatUpdatedAt("2026-01-01T11:58:00.000Z")).toBe("Updated 2 minutes ago");
  });

  it("handles absent and invalid timestamps", () => {
    expect(formatRelativeTime(undefined)).toBe("unknown");
    expect(formatRelativeTime("not-a-date")).toBe("unknown");
    expect(formatUpdatedAt(undefined)).toBe("No update timestamp");
  });
});
