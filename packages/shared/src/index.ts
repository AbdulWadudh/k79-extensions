export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
