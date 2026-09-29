export class ReadOnlyDemoError extends Error {
  constructor() {
    super("This public demo is read-only. Run the app locally to try editing releases.");
  }
}

export function isReadOnlyDemo(): boolean {
  return process.env.NODE_ENV === "production" && process.env.ALLOW_UNAUTHENTICATED_WRITES !== "true";
}

export function assertDemoWritable(): void {
  if (isReadOnlyDemo()) throw new ReadOnlyDemoError();
}
