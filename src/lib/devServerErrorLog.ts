/**
 * Logs server errors to the terminal during `next dev` (admin/Firebase debugging).
 * Does not run in production builds.
 */
export function devLogServerError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  console.error(`[dev][${context}]`, error);
}
