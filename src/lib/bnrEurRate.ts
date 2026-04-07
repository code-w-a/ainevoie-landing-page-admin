/** BNR daily rates: https://www.bnr.ro/nbrfxrates.xml — RON per 1 EUR (before multiplier). */

const BNR_FX_URL = "https://www.bnr.ro/nbrfxrates.xml";

export type BnrEurParseResult = {
  date: string;
  /** How many RON for 1 EUR */
  ronPerEur: number;
};

export function parseBnrEurXml(xml: string): BnrEurParseResult {
  const cube = xml.match(/<Cube\s+date="(\d{4}-\d{2}-\d{2})"/i);
  if (!cube) {
    throw new Error("BNR XML: missing Cube date");
  }
  const date = cube[1];

  const rateTag = xml.match(
    /<Rate\s+currency="EUR"\s*(?:multiplier="(\d+)")?\s*>([\d.,]+)<\/Rate>/i,
  );
  if (!rateTag) {
    throw new Error("BNR XML: missing EUR rate");
  }

  const multiplier = rateTag[1] ? parseInt(rateTag[1], 10) : 1;
  const raw = rateTag[2].replace(",", ".");
  const value = parseFloat(raw);
  if (!Number.isFinite(value) || value <= 0 || multiplier < 1) {
    throw new Error("BNR XML: invalid EUR rate value");
  }

  const ronPerEur = value / multiplier;
  return { date, ronPerEur };
}

export async function fetchBnrEurRate(): Promise<BnrEurParseResult> {
  const res = await fetch(BNR_FX_URL, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`BNR fetch failed: ${res.status}`);
  }
  const xml = await res.text();
  return parseBnrEurXml(xml);
}
