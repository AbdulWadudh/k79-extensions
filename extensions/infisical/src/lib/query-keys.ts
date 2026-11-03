import type { SecretScope } from "../api/types";

function folderScope(scope: SecretScope) {
  return ["folders", scope.projectId, scope.environment, scope.secretPath] as const;
}

function secretScope(scope: SecretScope) {
  return ["secrets", scope.projectId, scope.environment, scope.secretPath] as const;
}

export const queryKeys = {
  status: ["connection", "status"] as const,
  projects: ["projects"] as const,
  folderScope,
  folders: (scope: SecretScope, recursive = false) => [...folderScope(scope), recursive] as const,
  secretScope,
  secrets: (scope: SecretScope, recursive = false) => [...secretScope(scope), recursive] as const,
  secret: (scope: SecretScope, name: string) =>
    ["secret", scope.projectId, scope.environment, scope.secretPath, name] as const,
};
