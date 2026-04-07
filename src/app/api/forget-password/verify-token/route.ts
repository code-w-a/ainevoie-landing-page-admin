import { getRequestLocale } from "@/lib/apiLocale";
import { jsonApiError } from "@/lib/apiJsonError";

export const POST = async (req: Request) => {
  const locale = getRequestLocale(req);
  return jsonApiError(locale, "ENDPOINT_UNAVAILABLE", 501);
};
