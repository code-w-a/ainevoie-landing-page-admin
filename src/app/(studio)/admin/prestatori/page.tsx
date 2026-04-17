"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/useAdminData";
import {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerServiceOptions,
  providerStatusLabel,
  providerStatusVariant,
} from "@/lib/providers";
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

type ProviderItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  cityCode?: string;
  cityName?: string;
  countyCode?: string;
  countyName?: string;
  serviceType: string;
  onboardingStatus: keyof typeof providerStatusLabel;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  launchContactConsent?: boolean;
  launchContactConsentAt?: string | null;
  launchContactConsentVersion?: string | null;
  createdAt?: string;
};

type ProvidersResponse = {
  items: ProviderItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function getLegalConsentMeta(item: ProviderItem) {
  switch (getProviderLegalConsentState(item)) {
    case "accepted":
      return { label: "Acceptat", variant: "success" as const };
    case "partial":
      return { label: "Parțial", variant: "warning" as const };
    case "missing":
    default:
      return { label: "Lipsă", variant: "outline" as const };
  }
}

function getLaunchContactMeta(item: ProviderItem) {
  switch (getProviderLaunchContactConsentState(item)) {
    case "accepted":
      return { label: "Da", variant: "success" as const };
    case "declined":
      return { label: "Nu", variant: "secondary" as const };
    case "missing":
    default:
      return { label: "Lipsă", variant: "outline" as const };
  }
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
          Lista prestatorilor înregistrați prin onboarding.
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
            onChange={(event) => {
              setPage(1);
              setQ(event.target.value);
            }}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="all">Toate statusurile</option>
            <option value="new">Nou</option>
            <option value="in_review">În verificare</option>
            <option value="approved">Aprobat</option>
            <option value="rejected">Respins</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={countyCode}
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
            disabled={!countyCode}
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
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={serviceType}
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
          <CardDescription>{pagination?.total || 0} rezultate</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <p className="text-sm text-muted-foreground">
              Se încarcă prestatorii...
            </p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Județ / Oraș</TableHead>
                <TableHead>Serviciu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Termeni / Politică</TableHead>
                <TableHead>Contact lansare</TableHead>
                <TableHead>Creat la</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                    Nu există prestatori pentru filtrele curente.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.fullName}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>
                    {[item.countyName, item.cityName || item.city].filter(Boolean).join(" / ") ||
                      "-"}
                  </TableCell>
                  <TableCell>{item.serviceType}</TableCell>
                  <TableCell>
                    <Badge variant={providerStatusVariant(item.onboardingStatus)}>
                      {providerStatusLabel[item.onboardingStatus] || item.onboardingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const consentMeta = getLegalConsentMeta(item);
                      return <Badge variant={consentMeta.variant}>{consentMeta.label}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const contactMeta = getLaunchContactMeta(item);
                      return <Badge variant={contactMeta.variant}>{contactMeta.label}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>{formatAdminDateTime(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/prestatori/${item.id}`}>Vezi fișa</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Pagina {pagination?.page || 1} din {pagination?.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={(pagination?.page || 1) <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={(pagination?.page || 1) >= (pagination?.totalPages || 1)}
              >
                Următor
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
