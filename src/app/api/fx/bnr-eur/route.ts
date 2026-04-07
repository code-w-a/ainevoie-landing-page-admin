import { NextResponse } from "next/server";
import { fetchBnrEurRate } from "@/lib/bnrEurRate";

export const revalidate = 3600;

/**
 * Returns BNR EUR reference rate: RON per 1 EUR, and the rate date (last publishing day).
 */
export async function GET() {
  try {
    const { date, ronPerEur } = await fetchBnrEurRate();
    return NextResponse.json(
      { rate: ronPerEur, date },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "BNR_RATE_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
