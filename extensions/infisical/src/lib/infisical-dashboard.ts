import type { Project } from "@/api/types";
import { tryNormalizeSecretPath } from "./path";

export function infisicalProjectUrl(
  baseUrl: string,
  project?: Project | null,
  secretPath?: string,
): string {
  if (!project?.orgId) return baseUrl;

  const origin = new URL(baseUrl).origin;
  const appOrigin =
    origin === "https://us.infisical.com"
      ? "https://app.infisical.com"
      : origin === "https://eu.infisical.com"
        ? "https://eu.infisical.com"
        : origin;

  const url = new URL(
    `${appOrigin}/organizations/${project.orgId}/projects/secret-management/${project.id}/overview`,
  );

  const normalizedPath = secretPath ? tryNormalizeSecretPath(secretPath) : "/";
  if (normalizedPath && normalizedPath !== "/") {
    url.searchParams.set("secretPath", normalizedPath);
  }

  return url.toString();
}

export async function openInfisicalDashboard(url: string): Promise<void> {
  await chrome.tabs.create({ url });
}
