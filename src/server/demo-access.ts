export class ReadOnlyDemoError extends Error {
  constructor() {
    super("This public demo is read-only. Run the app locally to try editing releases.");
  }
}

export function isReadOnlyDemo(): boolean {
  return process.env.READ_ONLY_DEMO === "true";
}

export function assertDemoWritable(): void {
  if (isReadOnlyDemo()) throw new ReadOnlyDemoError();
}
