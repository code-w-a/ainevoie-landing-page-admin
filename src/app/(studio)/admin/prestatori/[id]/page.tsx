"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import {
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerLegalStatusLabel,
  providerStatusLabel,
  providerStatusVariant,
} from "@/lib/providers";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminFormGridSkeleton,
  AdminLogStackSkeleton,
  AdminPageHeaderSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProviderDocument = {
  uid?: string;
  id?: string;
  status?: string;
  accountStatus?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  authProviders?: string[];
  locale?: string | null;
  professionalProfile?: {
    businessName?: string | null;
    displayName?: string | null;
    specialization?: string | null;
    baseRateAmount?: number | null;
    baseRateCurrency?: string | null;
    coverageAreaText?: string | null;
    availabilitySummary?: string | null;
    shortBio?: string | null;
    avatarPath?: string | null;
    coverageArea?: Record<string, unknown> | null;
  } | null;
  documents?: {
    identity?: ProviderDocumentFile | null;
    professional?: ProviderDocumentFile | null;
  } | null;
  reviewState?: {
    submittedAt?: string | null;
    lastReviewedAt?: string | null;
  } | null;
  adminReview?: {
    reviewedBy?: string | null;
    action?: string | null;
    reason?: string | null;
    reviewedAt?: string | null;
  } | null;
  suspension?: {
    reason?: string | null;
    suspendedBy?: string | null;
    suspendedAt?: string | null;
  } | null;
  lastPublishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;

  // Legacy landing/onboarding fields kept visible in this admin case.
  fullName?: string;
  phone?: string;
  city?: string;
  cityCode?: string;
  cityName?: string;
  countyCode?: string;
  countyName?: string;
  coverageAreaText?: string | null;
  serviceType?: string;
  legalStatus?: keyof typeof providerLegalStatusLabel;
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
  onboardingStatus?: string;
  internalNotes?: string;
};

type ProviderDocumentFile = {
  status?: string | null;
  storagePath?: string | null;
  originalFileName?: string | null;
  uploadedAt?: string | null;
};

type ProviderCase = {
  provider?: ProviderDocument | null;
  providerDirectory?: Record<string, unknown> | null;
  availability?: Record<string, unknown> | null;
  services?: Array<Record<string, unknown>>;
  recentBookings?: Array<Record<string, unknown>>;
  recentAuditEvents?: Array<Record<string, unknown>>;
  item?: ProviderDocument | null;
};

type ReviewAction = "approve" | "reject" | "suspend" | "reinstate";

const actionMeta: Record<
  ReviewAction,
  { label: string; title: string; description: string; destructive?: boolean }
> = {
  approve: {
    label: "Aprobă",
    title: "Aprobă prestatorul",
    description: "Backend-ul va valida profilul, documentele și disponibilitatea înainte de aprobare.",
  },
  reject: {
    label: "Respinge",
    title: "Respinge prestatorul",
    description: "Prestatorul va putea corecta profilul și retrimite pentru verificare.",
    destructive: true,
  },
  suspend: {
    label: "Suspendă",
    title: "Suspendă prestatorul",
    description: "Prestatorul aprobat va fi retras din publicare până la reintegrare.",
    destructive: true,
  },
  reinstate: {
    label: "Reactivează",
    title: "Reactivează prestatorul",
    description: "Backend-ul va republica snapshot-ul public dacă regulile sunt îndeplinite.",
  },
};

function getProviderFromCase(data: ProviderCase | null) {
  return data?.provider || data?.item || null;
}

function getProviderId(provider: ProviderDocument | null, fallback?: string) {
  return provider?.uid || provider?.id || fallback || "";
}

function getDisplayName(provider: ProviderDocument) {
  return (
    provider.professionalProfile?.displayName ||
    provider.professionalProfile?.businessName ||
    provider.fullName ||
    provider.email ||
    "-"
  );
}

function getStatus(provider: ProviderDocument) {
  return provider.status || provider.onboardingStatus || "pre_registered";
}

function getStatusLabel(status?: string | null) {
  if (!status) return "-";
  return providerStatusLabel[status as keyof typeof providerStatusLabel] || status;
}

function getStatusIcon(status?: string | null) {
  switch (status) {
    case "approved":
      return CheckCircle2;
    case "rejected":
    case "suspended":
      return XCircle;
    case "pending_review":
    case "in_review":
      return FileSearch;
    default:
      return Clock3;
  }
}

function getDocumentMeta(doc?: ProviderDocumentFile | null) {
  const status = doc?.status;
  if (status === "uploaded" || status === "approved") {
    return { label: "Încărcat", ok: true, variant: "success" as const };
  }
  if (status === "pending" || status === "submitted") {
    return { label: "În așteptare", ok: false, variant: "warning" as const };
  }
  if (status === "rejected") {
    return { label: "Respins", ok: false, variant: "danger" as const };
  }
  return { label: "Lipsă", ok: false, variant: "outline" as const };
}

function hasConfiguredAvailability(provider: ProviderDocument, availability?: Record<string, unknown> | null) {
  if (provider.professionalProfile?.availabilitySummary) {
    return true;
  }
  if (!availability || typeof availability !== "object") {
    return false;
  }
  if (availability.configured === true) {
    return true;
  }
  const weekSchedule = availability.weekSchedule;
  if (!weekSchedule || typeof weekSchedule !== "object") {
    return false;
  }
  return Object.values(weekSchedule).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object" && "slots" in value) {
      return Array.isArray((value as { slots?: unknown[] }).slots) && Boolean((value as { slots?: unknown[] }).slots?.length);
    }
    return false;
  });
}

function formatValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "Da" : "Nu";
  }
  return "-";
}

function getAvailableActions(status: string): ReviewAction[] {
  if (status === "pending_review") return ["approve", "reject"];
  if (status === "approved") return ["suspend"];
  if (status === "suspended") return ["reinstate"];
  return [];
}

function ReviewDecisionDialog({
  action,
  open,
  loading,
  error,
  onOpenChange,
  onConfirm,
}: {
  action: ReviewAction | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const requiresReason = action === "reject" || action === "suspend";
  const meta = action ? actionMeta[action] : null;

  useEffect(() => {
    if (open) setReason("");
  }, [open, action]);

  if (!meta || !action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(event) => loading && event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        {requiresReason && (
          <div>
            <label className="mb-2 inline-block text-sm font-medium">Motiv obligatoriu</label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={reason}
              disabled={loading}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Scrie motivul care va fi transmis către backend..."
            />
          </div>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button
            type="button"
            variant={meta.destructive ? "destructive" : "default"}
            disabled={loading || (requiresReason && !reason.trim())}
            onClick={async () => {
              const done = await onConfirm(reason);
              if (done) onOpenChange(false);
            }}
          >
            {loading ? "Se procesează..." : meta.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<ProviderCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut încărca fișa prestatorului."));
      }
      setData((await res.json()) as ProviderCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut încărca fișa prestatorului.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const provider = getProviderFromCase(data);
  const status = provider ? getStatus(provider) : "";
  const StatusIcon = getStatusIcon(status);
  const availableActions = useMemo(() => getAvailableActions(status), [status]);

  async function submitReview(action: ReviewAction, reason: string) {
    if (!id) return false;
    setSaving(true);
    setActionError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut procesa decizia."));
      }
      await loadDetails();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut procesa decizia.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeaderSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <AdminFormGridSkeleton fields={10} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <AdminFormGridSkeleton fields={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent>
            <AdminLogStackSkeleton lines={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-rose-500">{error || "Prestatorul nu a fost găsit."}</p>
        <Button asChild variant="outline">
          <Link href="/admin/prestatori">Înapoi la listă</Link>
        </Button>
      </div>
    );
  }

  const providerId = getProviderId(provider, id);
  const profile = provider.professionalProfile || {};
  const identityMeta = getDocumentMeta(provider.documents?.identity);
  const professionalMeta = getDocumentMeta(provider.documents?.professional);
  const availabilityOk = hasConfiguredAvailability(provider, data?.availability);
  const profileOk = Boolean(profile.displayName && profile.specialization && (profile.coverageAreaText || provider.coverageAreaText));
  const publicSnapshotOk = Boolean(data?.providerDirectory);
  const legalConsentMeta =
    getProviderLegalConsentState(provider) === "accepted"
      ? { label: "Acceptat", variant: "success" as const }
      : getProviderLegalConsentState(provider) === "partial"
        ? { label: "Parțial", variant: "warning" as const }
        : { label: "Lipsă", variant: "outline" as const };
  const launchContactMeta =
    getProviderLaunchContactConsentState(provider) === "accepted"
      ? { label: "Da", variant: "success" as const }
      : getProviderLaunchContactConsentState(provider) === "declined"
        ? { label: "Nu", variant: "secondary" as const }
        : { label: "Lipsă", variant: "outline" as const };

  const checklist = [
    {
      label: "Profil profesional complet",
      ok: profileOk,
      detail: profileOk ? "Display name, specializare și zonă completate" : "Lipsesc date de profil",
    },
    {
      label: "Document identitate",
      ok: identityMeta.ok,
      detail: provider.documents?.identity?.originalFileName || identityMeta.label,
    },
    {
      label: "Document profesional",
      ok: professionalMeta.ok,
      detail: provider.documents?.professional?.originalFileName || professionalMeta.label,
    },
    {
      label: "Disponibilitate configurată",
      ok: availabilityOk,
      detail: profile.availabilitySummary || (availabilityOk ? "Configurată" : "Lipsă"),
    },
    {
      label: "Snapshot public",
      ok: publicSnapshotOk,
      detail: publicSnapshotOk ? "providerDirectory există" : "Nepublicat",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{getDisplayName(provider)}</h1>
            <Badge variant={providerStatusVariant(status)} className="gap-1.5">
              <StatusIcon className="h-3.5 w-3.5" />
              {getStatusLabel(status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {provider.email || "-"} {provider.phoneNumber || provider.phone ? `• ${provider.phoneNumber || provider.phone}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">ID: {providerId}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/prestatori">Înapoi la listă</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Verificare provider</CardTitle>
          <CardDescription>
            Checklist vizual pentru condițiile pe care backend-ul le validează la aprobare.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {checklist.map((item) => {
            const Icon = item.ok ? CheckCircle2 : AlertTriangle;
            return (
              <div key={item.label} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.ok ? "text-emerald-600" : "text-amber-600"}`} />
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatValue(item.detail)}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acțiuni</CardTitle>
          <CardDescription>
            Deciziile folosesc exclusiv callable-ul adminReviewProvider.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nu există acțiuni disponibile pentru statusul curent.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => {
                const meta = actionMeta[action];
                const Icon =
                  action === "approve"
                    ? ShieldCheck
                    : action === "reinstate"
                      ? RotateCcw
                      : action === "suspend"
                        ? AlertTriangle
                        : XCircle;
                return (
                  <Button
                    key={action}
                    variant={meta.destructive ? "destructive" : "default"}
                    disabled={saving}
                    onClick={() => setDialogAction(action)}
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </Button>
                );
              })}
            </div>
          )}
          {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil profesional</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nume public</p>
            <p className="text-sm">{formatValue(profile.displayName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Business</p>
            <p className="text-sm">{formatValue(profile.businessName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Specializare</p>
            <p className="text-sm">{formatValue(profile.specialization || provider.serviceType)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Zonă acoperire</p>
            <p className="text-sm">{formatValue(profile.coverageAreaText || provider.coverageAreaText)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Tarif de bază</p>
            <p className="text-sm">
              {typeof profile.baseRateAmount === "number"
                ? `${profile.baseRateAmount} ${profile.baseRateCurrency || "RON"}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Disponibilitate</p>
            <p className="text-sm">{formatValue(profile.availabilitySummary)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">Bio</p>
            <p className="text-sm">{formatValue(profile.shortBio)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documente și publicare</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Document identitate</p>
            <Badge variant={identityMeta.variant} className="mt-1">
              <FileCheck2 className="h-3.5 w-3.5" />
              {identityMeta.label}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              {provider.documents?.identity?.storagePath || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Document profesional</p>
            <Badge variant={professionalMeta.variant} className="mt-1">
              <FileCheck2 className="h-3.5 w-3.5" />
              {professionalMeta.label}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              {provider.documents?.professional?.storagePath || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Trimis la verificare</p>
            <p className="text-sm">{formatAdminDateTime(provider.reviewState?.submittedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Ultima decizie</p>
            <p className="text-sm">
              {formatValue(provider.adminReview?.action)} • {formatAdminDateTime(provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Ultimul motiv</p>
            <p className="text-sm">{formatValue(provider.adminReview?.reason || provider.suspension?.reason)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Publicat la</p>
            <p className="text-sm">{formatAdminDateTime(provider.lastPublishedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date preînregistrare</CardTitle>
          <CardDescription>
            Câmpurile capturate de formularul public rămân vizibile pentru context operațional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nume formular</p>
            <p className="text-sm">{formatValue(provider.fullName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Județ / Oraș</p>
            <p className="text-sm">
              {[provider.countyName, provider.cityName || provider.city].filter(Boolean).join(" / ") || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Serviciu formular</p>
            <p className="text-sm">{formatValue(provider.serviceType)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Statut juridic</p>
            <p className="text-sm">
              {provider.legalStatus ? providerLegalStatusLabel[provider.legalStatus] || provider.legalStatus : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nume companie / PFA</p>
            <p className="text-sm">{formatValue(provider.companyName)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">CUI</p>
            <p className="text-sm">{formatValue(provider.cui)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Nr. Registrului Comerțului</p>
            <p className="text-sm">{formatValue(provider.tradeRegisterNumber)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Estimare înființare</p>
            <p className="text-sm">{formatValue(provider.estimatedSetupTimeline)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Are contabil</p>
            <p className="text-sm">
              {provider.hasAccountant === "yes"
                ? "Da"
                : provider.hasAccountant === "no"
                  ? "Nu"
                  : provider.hasAccountant === "unsure"
                    ? "Încă nu"
                    : "-"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Termeni / politică</p>
            <Badge variant={legalConsentMeta.variant}>{legalConsentMeta.label}</Badge>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Contact lansare</p>
            <Badge variant={launchContactMeta.variant}>{launchContactMeta.label}</Badge>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Creat la</p>
            <p className="text-sm">{formatAdminDateTime(provider.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activitate recentă</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium">Audit</p>
            {!data?.recentAuditEvents?.length ? (
              <p className="text-sm text-muted-foreground">Nu există evenimente recente.</p>
            ) : (
              <div className="space-y-2">
                {data.recentAuditEvents.slice(0, 5).map((event, index) => (
                  <div key={String(event.id || index)} className="rounded-lg border border-border p-3 text-sm">
                    <p>{formatValue(event.action || event.type || event.message)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDateTime(event.createdAt || event.at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-3 text-sm font-medium">Servicii / booking-uri</p>
            <p className="text-sm text-muted-foreground">
              {data?.services?.length || 0} servicii, {data?.recentBookings?.length || 0} booking-uri recente.
            </p>
          </div>
        </CardContent>
      </Card>

      <ReviewDecisionDialog
        action={dialogAction}
        open={Boolean(dialogAction)}
        loading={saving}
        error={actionError}
        onOpenChange={(open) => {
          if (!open) {
            setDialogAction(null);
            setActionError(null);
          }
        }}
        onConfirm={async (reason) => {
          if (!dialogAction) return false;
          return submitReview(dialogAction, reason);
        }}
      />
    </div>
  );
}
