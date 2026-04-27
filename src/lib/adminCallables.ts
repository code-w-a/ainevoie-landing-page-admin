import { requireEnv } from "@/lib/firebaseAdmin";
import {
  parseCallableErrorResponse,
  readCallableErrorMessage,
  sanitizePayload,
} from "@/lib/newsletterAdmin";

export class AdminCallableError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "AdminCallableError";
    this.status = status;
  }
}

function getAdminApiKey() {
  const apiKey = process.env.ADMIN_API_KEY;
  if (!apiKey) {
    throw new AdminCallableError("Missing env: ADMIN_API_KEY", 500);
  }
  return apiKey;
}

function unwrapCallableResult(payload: unknown) {
  if (payload && typeof payload === "object" && "result" in payload) {
    return (payload as { result: unknown }).result;
  }
  return payload;
}

export async function callAdminCallable<T>(
  name: string,
  data: Record<string, unknown>,
  fallbackError: string
): Promise<T> {
  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  const region = process.env.FIREBASE_REGION || "europe-west1";
  const url = `https://${region}-${projectId}.cloudfunctions.net/${name}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: sanitizePayload({
        ...data,
        adminApiKey: getAdminApiKey(),
      }),
    }),
  });

  const payload = await response.clone().json().catch(() => null);
  const callableError = readCallableErrorMessage(payload);

  if (!response.ok || callableError) {
    throw new AdminCallableError(
      callableError || (await parseCallableErrorResponse(response, fallbackError)),
      response.ok ? 400 : response.status
    );
  }

  return unwrapCallableResult(payload) as T;
}
