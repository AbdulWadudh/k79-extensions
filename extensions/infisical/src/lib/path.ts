export function tryNormalizeSecretPath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  if (trimmed === "/") return "/";

  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailing = withLeading.replace(/\/+$/, "");
  const segments = withoutTrailing.split("/").filter(Boolean);

  if (segments.some((segment) => segment === ".." || segment === ".")) return null;
  if (segments.some((segment) => segment.length > 255)) return null;

  return `/${segments.join("/")}`;
}

export function normalizeSecretPath(value: string): string {
  const normalized = tryNormalizeSecretPath(value);
  if (!normalized) throw new Error("Secret path cannot contain '.' or '..' segments.");
  return normalized;
}

export function parentSecretPath(path: string): string | null {
  const normalized = normalizeSecretPath(path);
  if (normalized === "/") return null;
  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return parts.length === 0 ? "/" : `/${parts.join("/")}`;
}

export function displaySecretPath(path: string): string {
  return normalizeSecretPath(path);
}
