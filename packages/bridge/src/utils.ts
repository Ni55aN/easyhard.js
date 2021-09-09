export function sanitize<E>(error: E): string {
  return error instanceof Error ? error.message : String(error)
}
