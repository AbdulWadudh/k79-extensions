export type EnvironmentTone = "dev" | "staging" | "prod" | "neutral";

export function environmentTone(slug: string): EnvironmentTone {
  const normalized = slug.toLowerCase();
  if (/(^|[-_])dev|development|local/.test(normalized)) return "dev";
  if (/stag|qa|test|preview/.test(normalized)) return "staging";
  if (/prod|live|release/.test(normalized)) return "prod";
  return "neutral";
}

export function environmentToneClass(tone: EnvironmentTone): string {
  switch (tone) {
    case "dev":
      return "bg-env-dev/10 text-env-dev";
    case "staging":
      return "bg-env-staging/10 text-env-staging";
    case "prod":
      return "bg-env-prod/10 text-env-prod";
    case "neutral":
      return "bg-surface-muted text-ink-soft";
  }
}

export function environmentDotClass(tone: EnvironmentTone): string {
  switch (tone) {
    case "dev":
      return "bg-env-dev";
    case "staging":
      return "bg-env-staging";
    case "prod":
      return "bg-env-prod";
    case "neutral":
      return "bg-line-strong";
  }
}
