import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminDb, serializeDoc } from "@/lib/firebaseAdmin";
import {
  isProviderCityOption,
  isProviderServiceOption,
  isProviderStatus,
  providerCityOptions,
  providerServiceOptions,
} from "@/lib/providers";

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
    const city = normalizeQuery(searchParams.get("city"));
    const serviceType = normalizeQuery(searchParams.get("serviceType"));
    const q = normalizeQuery(searchParams.get("q"));

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
      const rowCity = String(row.cityNormalized || row.city || "").toLowerCase();
      const rowService = String(
        row.serviceTypeNormalized || row.serviceType || ""
      ).toLowerCase();
      const rowName = String(row.fullName || "").toLowerCase();
      const rowEmail = String(row.email || "").toLowerCase();

      const cityMatch = !city || rowCity.includes(city);
      const serviceMatch = !serviceType || rowService.includes(serviceType);
      const textMatch =
        !q ||
        rowName.includes(q) ||
        rowEmail.includes(q) ||
        rowCity.includes(q) ||
        rowService.includes(q);

      return cityMatch && serviceMatch && textMatch;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return NextResponse.json({
      items,
      filters: {
        cities: providerCityOptions,
        services: providerServiceOptions,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Nu am putut încărca prestatorii." },
      { status: 500 }
    );
  }
}
