import { getRequestLocale } from "@/lib/apiLocale";
import { jsonApiError } from "@/lib/apiJsonError";

export async function POST(req: Request) {
  const locale = getRequestLocale(req);
  return jsonApiError(locale, "ENDPOINT_UNAVAILABLE", 501);
}
