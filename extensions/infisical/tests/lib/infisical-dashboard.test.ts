import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Project } from "@/api/types";
import { infisicalProjectUrl, openInfisicalDashboard } from "@/lib/infisical-dashboard";

const create = vi.fn();

const project: Project = {
  id: "project-1",
  name: "Test",
  slug: "test",
  orgId: "org-1",
  environments: [],
};

beforeEach(() => {
  create.mockReset();
  create.mockResolvedValue({});
  vi.stubGlobal("chrome", { tabs: { create } });
});

describe("Infisical dashboard link", () => {
  it("builds the US Cloud project overview URL", () => {
    expect(infisicalProjectUrl("https://us.infisical.com", project)).toBe(
      "https://app.infisical.com/organizations/org-1/projects/secret-management/project-1/overview",
    );
  });

  it("keeps the current folder in the URL", () => {
    expect(infisicalProjectUrl("https://us.infisical.com", project, "/LMS-BACKEND")).toBe(
      "https://app.infisical.com/organizations/org-1/projects/secret-management/project-1/overview?secretPath=%2FLMS-BACKEND",
    );
    expect(infisicalProjectUrl("https://us.infisical.com", project, "/LMS-BACKEND/dawdaw")).toBe(
      "https://app.infisical.com/organizations/org-1/projects/secret-management/project-1/overview?secretPath=%2FLMS-BACKEND%2Fdawdaw",
    );
  });

  it("normalizes the folder and omits it at the root", () => {
    expect(infisicalProjectUrl("https://us.infisical.com", project, "LMS-BACKEND/")).toBe(
      "https://app.infisical.com/organizations/org-1/projects/secret-management/project-1/overview?secretPath=%2FLMS-BACKEND",
    );
    expect(infisicalProjectUrl("https://us.infisical.com", project, "/")).toBe(
      "https://app.infisical.com/organizations/org-1/projects/secret-management/project-1/overview",
    );
  });

  it("builds the EU Cloud project overview URL", () => {
    expect(infisicalProjectUrl("https://eu.infisical.com", project, "/LMS-BACKEND")).toBe(
      "https://eu.infisical.com/organizations/org-1/projects/secret-management/project-1/overview?secretPath=%2FLMS-BACKEND",
    );
  });

  it("uses the self-hosted origin and falls back without an organization", () => {
    expect(infisicalProjectUrl("https://infisical.example.com", project)).toBe(
      "https://infisical.example.com/organizations/org-1/projects/secret-management/project-1/overview",
    );
    expect(
      infisicalProjectUrl("https://infisical.example.com", { ...project, orgId: undefined }),
    ).toBe("https://infisical.example.com");
  });

  it("opens the built URL in a new tab", async () => {
    const url = infisicalProjectUrl("https://us.infisical.com", project, "/LMS-BACKEND");
    await openInfisicalDashboard(url);
    expect(create).toHaveBeenCalledWith({ url });
  });
});
