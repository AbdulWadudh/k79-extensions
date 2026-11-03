import type { SecretScope } from "../api/types";

export const queryKeys = {
  status: ["connection", "status"] as const,
  projects: ["projects"] as const,
  folders: (scope: SecretScope) =>
    ["folders", scope.projectId, scope.environment, scope.secretPath] as const,
  secrets: (scope: SecretScope) =>
    ["secrets", scope.projectId, scope.environment, scope.secretPath] as const,
  secret: (scope: SecretScope, name: string) =>
    ["secret", scope.projectId, scope.environment, scope.secretPath, name] as const,
};
