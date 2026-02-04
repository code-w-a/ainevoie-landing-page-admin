import { defineSecret } from "firebase-functions/params";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

export const ADMIN_API_KEY = defineSecret("ADMIN_API_KEY");

export function requireAdmin(request: CallableRequest) {
  if (request.auth?.token?.admin === true) {
    return;
  }

  const apiKey = typeof request.data?.adminApiKey === "string"
    ? request.data.adminApiKey
    : "";

  if (apiKey && apiKey === ADMIN_API_KEY.value()) {
    return;
  }

  throw new HttpsError("permission-denied", "Admin access required.");
}
