function originFor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
}

export function isInfisicalCloudOrigin(origin: string): boolean {
  return origin === "https://us.infisical.com" || origin === "https://eu.infisical.com";
}

export async function requestInstancePermission(input: string): Promise<void> {
  const origin = originFor(input);
  if (!origin || isInfisicalCloudOrigin(origin)) return;

  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  if (!granted) {
    throw new Error("Chrome blocked access to this instance. Grant the permission and try again.");
  }
}
