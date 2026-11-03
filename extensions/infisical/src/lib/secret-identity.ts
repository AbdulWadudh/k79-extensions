export type SecretIdentityInput = {
  path: string;
  key: string;
};

export function secretIdentity(secret: SecretIdentityInput): string {
  return `${secret.path}\u0000${secret.key}`;
}
