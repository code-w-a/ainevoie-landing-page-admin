"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import {
  providerServiceOptions,
  providerStatusLabel,
  providerStatusVariant,
} from "@/lib/providers";
import { PROVIDER_STATUSES, type ProviderStatus } from "@/types/provider";
import { ROMANIA_COUNTIES, getCitiesByCounty } from "@/lib/romaniaLocations";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProviderListItem = {
  providerId?: string;
  id?: string;
  status?: ProviderStatus | string;
  accountStatus?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  businessName?: string | null;
  displayName?: string | null;
  specialization?: string | null;
  coverageAreaText?: string | null;
  availabilitySummary?: string | null;
  identityDocumentStatus?: string | null;
  professionalDocumentStatus?: string | null;
  submittedAt?: string | null;
  lastReviewedAt?: string | null;
  reviewedAt?: string | null;
  reviewAction?: string | null;
  lastPublishedAt?: string | null;
  updatedAt?: string | null;
};

type ProvidersResponse = {
  items: ProviderListItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function getProviderId(item: ProviderListItem) {
  return item.providerId || item.id || "";
}

function getStatusLabel(status?: string | null) {
  if (!status) return "-";
  return providerStatusLabel[status as keyof typeof providerStatusLabel] || status;
}

function getDocumentMeta(status?: string | null) {
  if (status === "uploaded" || status === "approved") {
    return { label: "Încărcat", variant: "success" as const };
  }
  if (status === "pending" || status === "submitted") {
    return { label: "În așteptare", variant: "warning" as const };
  }
  if (status === "rejected") {
    return { label: "Respins", variant: "danger" as const };
  }
  return { label: "Lipsă", variant: "outline" as const };
}

function formatReviewTimeline(item: ProviderListItem) {
  const submitted = formatAdminDateTime(item.submittedAt);
  const reviewed = formatAdminDateTime(item.lastReviewedAt || item.reviewedAt);
  const published = formatAdminDateTime(item.lastPublishedAt);

  return [
    submitted !== "-" ? `Trimis: ${submitted}` : null,
    reviewed !== "-" ? `Revizuit: ${reviewed}` : null,
    published !== "-" ? `Publicat: ${published}` : null,
  ].filter(Boolean);
}

export default function AdminProvidersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [countyCode, setCountyCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [page, setPage] = useState(1);
  const availableCities = useMemo(() => getCitiesByCounty(countyCode), [countyCode]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setCityCode("");
  }, [countyCode]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", "20");
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    if (status !== "all") params.set("status", status);
    if (countyCode) params.set("countyCode", countyCode);
    if (cityCode) params.set("cityCode", cityCode);
    if (serviceType.trim()) params.set("serviceType", serviceType.trim());
    return `/api/admin/providers?${params.toString()}`;
  }, [page, debouncedQ, status, countyCode, cityCode, serviceType]);

  const { data, loading, error } = useAdminData<ProvidersResponse>(endpoint);
  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prestatori</h1>
        <p className="text-sm text-muted-foreground">
          Verificare operațională pentru prestatorii înscriși și trimiși la review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Căutare și filtre</CardTitle>
          <CardDescription>Filtrează după status, județ, oraș, serviciu sau text.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <Input
            placeholder="Căutare nume/email"
            value={q}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setQ(event.target.value);
            }}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={status}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="all">Toate statusurile</option>
            {PROVIDER_STATUSES.map((providerStatus) => (
              <option key={providerStatus} value={providerStatus}>
                {providerStatusLabel[providerStatus]}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={countyCode}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setCountyCode(event.target.value);
              setCityCode("");
            }}
          >
            <option value="">Toate județele</option>
            {ROMANIA_COUNTIES.map((county) => (
              <option key={county.code} value={county.code}>
                {county.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            value={cityCode}
            disabled={loading || !countyCode}
            onChange={(event) => {
              setPage(1);
              setCityCode(event.target.value);
            }}
          >
            <option value="">{countyCode ? "Toate orașele" : "Alege județul"}</option>
            {availableCities.map((city) => (
              <option key={city.cityCode} value={city.cityCode}>
                {city.cityName}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={serviceType}
            disabled={loading}
            onChange={(event) => {
              setPage(1);
              setServiceType(event.target.value);
            }}
          >
            <option value="">Toate serviciile</option>
            {providerServiceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              setPage(1);
              setQ("");
              setStatus("all");
              setCountyCode("");
              setCityCode("");
              setServiceType("");
            }}
          >
            Resetează filtre
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista prestatori</CardTitle>
          <CardDescription>{pagination?.total || items.length} rezultate</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}

          {loading ?
            <AdminTableSkeleton rows={12} columns={9} />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Specializare</TableHead>
                  <TableHead>Zonă</TableHead>
                  <TableHead>Document identitate</TableHead>
                  <TableHead>Document profesional</TableHead>
                  <TableHead>Disponibilitate</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                      Nu există prestatori pentru filtrele curente.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => {
                  const providerId = getProviderId(item);
                  const identityMeta = getDocumentMeta(item.identityDocumentStatus);
                  const professionalMeta = getDocumentMeta(item.professionalDocumentStatus);
                  const timeline = formatReviewTimeline(item);

                  return (
                    <TableRow key={providerId || item.email || item.displayName}>
                      <TableCell>
                        <div className="font-medium">
                          {item.displayName || item.businessName || providerId || "-"}
                        </div>
                        {item.businessName && item.businessName !== item.displayName && (
                          <div className="text-xs text-muted-foreground">{item.businessName}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{item.email || "-"}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.phoneNumber || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={providerStatusVariant(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.specialization || "-"}</TableCell>
                      <TableCell>{item.coverageAreaText || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={identityMeta.variant}>{identityMeta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={professionalMeta.variant}>{professionalMeta.label}</Badge>
                      </TableCell>
                      <TableCell>{item.availabilitySummary || "-"}</TableCell>
                      <TableCell>
                        {timeline.length ? (
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {timeline.map((line) => (
                              <div key={line}>{line}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild disabled={!providerId}>
                          <Link href={`/admin/prestatori/${providerId}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Detalii
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>
                Pagina {pagination.page} din {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Înapoi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= pagination.totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Înainte
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
