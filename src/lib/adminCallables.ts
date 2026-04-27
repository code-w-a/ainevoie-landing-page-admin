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

function redactAdminPayload(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      key.toLowerCase().includes("key") ? "[redacted]" : value,
    ])
  );
}

async function readResponseTextPreview(response: Response) {
  try {
    const text = await response.clone().text();
    return text.trim().slice(0, 1000);
  } catch {
    return "";
  }
}

export async function callAdminCallable<T>(
  name: string,
  data: Record<string, unknown>,
  fallbackError: string,
  authToken?: string
): Promise<T> {
  const projectId = requireEnv("FIREBASE_PROJECT_ID");
  const region = process.env.FIREBASE_REGION || "europe-west1";
  const url = `https://${region}-${projectId}.cloudfunctions.net/${name}`;
  const payloadData = sanitizePayload({
    ...data,
    adminApiKey: getAdminApiKey(),
  });

  console.info("[admin-callable] request", {
    name,
    url,
    payload: redactAdminPayload(payloadData),
  });

  const headers = new Headers({ "Content-Type": "application/json" });
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: payloadData,
    }),
  });

  const payload = await response.clone().json().catch(() => null);
  const callableError = readCallableErrorMessage(payload);

  console.info("[admin-callable] response", {
    name,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
    hasCallableError: Boolean(callableError),
  });

  if (!response.ok || callableError) {
    console.error("[admin-callable] failed", {
      name,
      status: response.status,
      statusText: response.statusText,
      callableError,
      bodyPreview: await readResponseTextPreview(response),
    });

    throw new AdminCallableError(
      callableError || (await parseCallableErrorResponse(response, fallbackError)),
      response.ok ? 400 : response.status
    );
  }

  return unwrapCallableResult(payload) as T;
}
