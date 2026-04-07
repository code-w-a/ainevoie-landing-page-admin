import { NextResponse } from "next/server";

import type { AppLocale } from "./apiLocale";
import { getApiErrorMessage } from "./apiMessages";

export function jsonApiError(locale: AppLocale, code: string, status: number) {
  return NextResponse.json(
    { error: getApiErrorMessage(locale, code), code },
    { status }
  );
}
