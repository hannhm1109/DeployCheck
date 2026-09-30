export function authNextPath(value: unknown): string {
  return typeof value === "string" && /^\/join\/[a-f0-9]{64}$/.test(value) ? value : "/";
}
