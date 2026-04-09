"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/components/admin/adminApi";
import {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerLegalStatusLabel,
  providerStatusLabel,
} from "@/lib/providers";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock3, FileSearch, XCircle } from "lucide-react";

type ProviderDetails = {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  serviceType: string;
  legalStatus: keyof typeof providerLegalStatusLabel;
  companyName?: string | null;
  cui?: string | null;
  tradeRegisterNumber?: string | null;
  estimatedSetupTimeline?: string | null;
  hasAccountant?: "yes" | "no" | "unsure" | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  launchContactConsent?: boolean;
  launchContactConsentAt?: string | null;
  launchContactConsentVersion?: string | null;
  onboardingStatus: keyof typeof providerStatusLabel;
  internalNotes?: string;
  createdAt?: string;
};

type ProviderEvent = {
  id: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorUid?: string;
  note?: string | null;
  createdAt?: string;
};

function getStatusMeta(status?: string | null) {
  switch (status) {
    case "approved":
      return {
        label: providerStatusLabel.approved,
        variant: "success" as const,
        Icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: providerStatusLabel.rejected,
        variant: "danger" as const,
        Icon: XCircle,
      };
    case "in_review":
      return {
        label: providerStatusLabel.in_review,
        variant: "warning" as const,
        Icon: FileSearch,
      };
    case "new":
    default:
      return {
        label: providerStatusLabel.new,
        variant: "outline" as const,
        Icon: Clock3,
      };
  }
}

function getLegalConsentMeta(data: ProviderDetails) {
  switch (getProviderLegalConsentState(data)) {
    case "accepted":
      return { label: "Acceptat", variant: "success" as const };
    case "partial":
      return { label: "Parțial", variant: "warning" as const };
    case "missing":
    default:
      return { label: "Lipsă", variant: "outline" as const };
  }
}

function getLaunchContactMeta(data: ProviderDetails) {
  switch (getProviderLaunchContactConsentState(data)) {
    case "accepted":
      return { label: "Da", variant: "success" as const };
    case "declined":
      return { label: "Nu", variant: "secondary" as const };
    case "missing":
    default:
      return { label: "Lipsă", variant: "outline" as const };
  }
}

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ProviderEvent[]>([]);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("load_failed");
      }
      const json = await res.json();
      const item = json?.item as ProviderDetails;
      const history = (json?.events || []) as ProviderEvent[];
      setData(item);
      setStatus(item?.onboardingStatus || "new");
      setNotes(item?.internalNotes || "");
      setEvents(history);
    } catch {
      setError("Nu am putut încărca fișa prestatorului.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function saveChanges() {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingStatus: status,
          internalNotes: notes,
        }),
      });
      if (!res.ok) {
        throw new Error("update_failed");
      }
      await loadDetails();
    } catch {
      setError("Nu am putut salva modificările.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Se încarcă prestatorul...</p>;
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-500">{error || "Prestatorul nu a fost găsit."}</p>
        <Button asChild variant="outline">
          <Link href="/admin/prestatori">Înapoi la listă</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.fullName}</h1>
          <p className="text-sm text-muted-foreground">{data.email}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/prestatori">Înapoi la listă</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date prestator</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Telefon</p>
            <p className="text-sm">{data.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Oraș</p>
            <p className="text-sm">{data.city || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Serviciu</p>
            <p className="text-sm">{data.serviceType || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Statut juridic</p>
            <p className="text-sm">
              {providerLegalStatusLabel[data.legalStatus] || data.legalStatus || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nume companie / PFA</p>
            <p className="text-sm">{data.companyName || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">CUI</p>
            <p className="text-sm">{data.cui || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nr. Registrului Comerțului</p>
            <p className="text-sm">{data.tradeRegisterNumber || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Estimare înființare</p>
            <p className="text-sm">{data.estimatedSetupTimeline || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Are contabil</p>
            <p className="text-sm">
              {data.hasAccountant === "yes"
                ? "Da"
                : data.hasAccountant === "no"
                  ? "Nu"
                  : data.hasAccountant === "unsure"
                    ? "Încă nu"
                    : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Status curent</p>
            {(() => {
              const statusMeta = getStatusMeta(status);
              const Icon = statusMeta.Icon;
              return (
                <Badge variant={statusMeta.variant} className="gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {statusMeta.label}
                </Badge>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consimțăminte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Termeni / politică</p>
            {(() => {
              const consentMeta = getLegalConsentMeta(data);
              return <Badge variant={consentMeta.variant}>{consentMeta.label}</Badge>;
            })()}
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Contact lansare</p>
            {(() => {
              const contactMeta = getLaunchContactMeta(data);
              return <Badge variant={contactMeta.variant}>{contactMeta.label}</Badge>;
            })()}
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Termeni acceptați la</p>
            <p className="text-sm">{formatAdminDateTime(data.termsAcceptedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Versiune termeni</p>
            <p className="text-sm">{data.termsVersion || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Politică acceptată la</p>
            <p className="text-sm">{formatAdminDateTime(data.privacyAcceptedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Versiune politică</p>
            <p className="text-sm">{data.privacyVersion || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Contact lansare la</p>
            <p className="text-sm">{formatAdminDateTime(data.launchContactConsentAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Versiune contact</p>
            <p className="text-sm">{data.launchContactConsentVersion || "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestionare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 inline-block text-sm font-medium">Schimbă status</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm md:max-w-xs"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="new">Nou</option>
              <option value="in_review">În verificare</option>
              <option value="approved">Aprobat</option>
              <option value="rejected">Respins</option>
            </select>
          </div>
          <div>
            <label className="mb-2 inline-block text-sm font-medium">Notițe interne</label>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observații pentru echipa internă..."
            />
          </div>
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <Button onClick={saveChanges} disabled={saving}>
            {saving ? "Se salvează..." : "Salvează modificările"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Istoric status</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există evenimente încă.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                    {(() => {
                      const toMeta = getStatusMeta(event.toStatus);
                      const ToIcon = toMeta.Icon;
                      const fromMeta = getStatusMeta(event.fromStatus);
                      return (
                        <>
                          <Badge variant={toMeta.variant} className="gap-1.5">
                            <ToIcon className="h-3.5 w-3.5" />
                            {toMeta.label}
                          </Badge>
                          {event.fromStatus && (
                            <span className="text-muted-foreground">
                              din {fromMeta.label}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatAdminDateTime(event.createdAt)} • actor:{" "}
                    {event.actorUid || "necunoscut"}
                  </p>
                  {event.note && <p className="mt-2 text-sm">{event.note}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
