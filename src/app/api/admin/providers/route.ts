import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import { captureServerException } from "@/lib/sentryServer";
import {
  isProviderCityOption,
  isProviderServiceOption,
  isProviderStatus,
  providerServiceOptions,
} from "@/lib/providers";
import {
  ROMANIA_COUNTIES,
  ROMANIA_URBAN_LOCALITIES,
  findRomaniaCity,
  findRomaniaCityByCode,
  findRomaniaCityByName,
  getCitiesByCounty,
  isRomaniaCountyCode,
  normalizeRomaniaLocationCode,
  normalizeRomaniaLocationName,
} from "@/lib/romaniaLocations";

const MAX_SCAN_DOCS = 500;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizeQuery(value: string | null) {
  return (value || "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE), 1),
      MAX_PAGE_SIZE
    );

    const status = normalizeQuery(searchParams.get("status"));
    const countyCode = normalizeRomaniaLocationCode(searchParams.get("countyCode"));
    const cityCode = normalizeRomaniaLocationCode(searchParams.get("cityCode"));
    const city = normalizeQuery(searchParams.get("city"));
    const serviceType = normalizeQuery(searchParams.get("serviceType"));
    const q = normalizeQuery(searchParams.get("q"));

    if (countyCode && !isRomaniaCountyCode(countyCode)) {
      return NextResponse.json({ error: "Filtrul de județ este nevalid." }, { status: 400 });
    }

    const selectedCity = cityCode
      ? countyCode
        ? findRomaniaCity(countyCode, cityCode)
        : findRomaniaCityByCode(cityCode)
      : null;

    if (cityCode && !selectedCity) {
      return NextResponse.json({ error: "Filtrul de oraș este nevalid." }, { status: 400 });
    }

    if (city && !isProviderCityOption(city)) {
      return NextResponse.json({ error: "Filtrul de oraș este nevalid." }, { status: 400 });
    }
    if (serviceType && !isProviderServiceOption(serviceType)) {
      return NextResponse.json({ error: "Filtrul de serviciu este nevalid." }, { status: 400 });
    }

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db
      .collection("providers")
      .orderBy("createdAt", "desc")
      .limit(MAX_SCAN_DOCS);

    if (status && isProviderStatus(status)) {
      query = query.where("onboardingStatus", "==", status);
    }

    const snapshot = await query.get();
    const rows = snapshot.docs.map(serializeDoc).filter(Boolean) as Array<Record<string, any>>;

    const filtered = rows.filter((row) => {
      const rowCityValue = String(row.cityName || row.city || "");
      const legacyLocation = findRomaniaCityByName(rowCityValue);
      const rowCountyCode =
        normalizeRomaniaLocationCode(row.countyCode) || legacyLocation?.countyCode || "";
      const rowCityCode =
        normalizeRomaniaLocationCode(row.cityCode) || legacyLocation?.cityCode || "";
      const rowCity = normalizeRomaniaLocationName(
        row.cityNameNormalized || row.cityName || row.cityNormalized || row.city || ""
      );
      const rowService = String(
        row.serviceTypeNormalized || row.serviceType || ""
      ).toLowerCase();
      const rowName = String(row.fullName || "").toLowerCase();
      const rowEmail = String(row.email || "").toLowerCase();
      const rowCounty = normalizeRomaniaLocationName(row.countyName || legacyLocation?.countyName);

      const countyMatch = !countyCode || rowCountyCode === countyCode;
      const selectedCityMatch =
        !selectedCity ||
        rowCityCode === selectedCity.cityCode ||
        rowCity === normalizeRomaniaLocationName(selectedCity.cityName);
      const legacyCityMatch = !city || rowCity.includes(normalizeRomaniaLocationName(city));
      const serviceMatch = !serviceType || rowService.includes(serviceType);
      const textMatch =
        !q ||
        rowName.includes(q) ||
        rowEmail.includes(q) ||
        rowCounty.includes(q) ||
        rowCity.includes(q) ||
        rowService.includes(q);

      return countyMatch && selectedCityMatch && legacyCityMatch && serviceMatch && textMatch;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return NextResponse.json({
      items,
      filters: {
        counties: ROMANIA_COUNTIES,
        cities: countyCode ? getCitiesByCounty(countyCode) : ROMANIA_URBAN_LOCALITIES,
        services: providerServiceOptions,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error) {
    captureServerException(error, { route: "api/admin/providers/route.ts" });
    return NextResponse.json(
      { error: "Nu am putut încărca prestatorii." },
      { status: 500 }
    );
  }
}
