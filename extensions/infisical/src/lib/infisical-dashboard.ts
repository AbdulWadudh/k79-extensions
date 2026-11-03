import type { Project } from "@/api/types";

export function infisicalProjectUrl(baseUrl: string, project?: Project | null): string {
  if (!project?.orgId) return baseUrl;

  const origin = new URL(baseUrl).origin;
  const appOrigin =
    origin === "https://us.infisical.com"
      ? "https://app.infisical.com"
      : origin === "https://eu.infisical.com"
        ? "https://eu.infisical.com"
        : origin;

  return `${appOrigin}/organizations/${project.orgId}/projects/secret-management/${project.id}/overview`;
}

export async function openInfisicalDashboard(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}
