"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  CircleDashed,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSearch,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  UserRound,
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
type ProviderDocumentType = "identity" | "professional";

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
type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "danger";
type ChecklistState = "complete" | "missing" | "review";

type TimelineEvent = {
  id: string;
  title: string;
  at?: string | null;
  actor?: string | null;
  description?: string | null;
};

const actionMeta: Record<
  ReviewAction,
  { label: string; title: string; description: string; destructive?: boolean }
> = {
  approve: {
    label: "Aprobă",
    title: "Aprobă prestatorul",
    description: "Sistemul verifică profilul, documentele și disponibilitatea înainte de aprobare.",
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
    description: "Prestatorul va redeveni vizibil pentru clienți dacă datele necesare sunt complete.",
  },
};

const reviewActionLabel: Record<string, string> = {
  approve: "Aprobat",
  reject: "Respins",
  suspend: "Suspendat",
  reinstate: "Reactivat",
};

const checklistStateMeta: Record<
  ChecklistState,
  { label: string; variant: BadgeVariant; iconClassName: string }
> = {
  complete: {
    label: "Complet",
    variant: "success",
    iconClassName: "text-emerald-600",
  },
  missing: {
    label: "Lipsă",
    variant: "warning",
    iconClassName: "text-amber-600",
  },
  review: {
    label: "Necesită verificare",
    variant: "warning",
    iconClassName: "text-amber-600",
  },
};

function getProviderFromCase(data: ProviderCase | null) {
  return data?.provider || data?.item || null;
}

function getProviderId(provider: ProviderDocument | null, fallback?: string) {
  return provider?.uid || provider?.id || fallback || "";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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
    return { label: status === "approved" ? "Verificat" : "Încărcat", ok: true, variant: "success" as const };
  }
  if (status === "pending" || status === "submitted") {
    return { label: "Necesită verificare", ok: false, variant: "warning" as const };
  }
  if (status === "rejected") {
    return { label: "Respins", ok: false, variant: "danger" as const };
  }
  return { label: "Lipsă", ok: false, variant: "outline" as const };
}

function canViewProviderDocument(doc?: ProviderDocumentFile | null) {
  return (
    Boolean(doc?.storagePath) &&
    (doc?.status === "uploaded" || doc?.status === "approved")
  );
}

function getDocumentDisplayName(doc?: ProviderDocumentFile | null) {
  if (doc?.originalFileName) {
    return doc.originalFileName;
  }
  if (doc?.storagePath) {
    return "Fișier încărcat";
  }
  return "Nu există informații";
}

function hasConfiguredAvailability(provider: ProviderDocument, availability?: Record<string, unknown> | null) {
  if (provider.professionalProfile?.availabilitySummary) {
    return true;
  }
  if (!availability || typeof availability !== "object") {
    return false;
  }
  if (availability.hasConfiguredAvailability === true || availability.configured === true) {
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

function formatValue(value: unknown, fallback = "Nu este completat") {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "Da" : "Nu";
  }
  return fallback;
}

function formatCompactValue(value: unknown) {
  return formatValue(value, "-");
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number") {
    return "Nu este completat";
  }
  return `${amount} ${currency || "RON"}`;
}

function formatReviewAction(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }
  return reviewActionLabel[value] || value;
}

function formatActivityLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Activitate provider";
  }
  const cleaned = value.replace(/^provider\./, "");
  const normalized = cleaned.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  if (normalized === "submit for review" || normalized === "submitted for review") {
    return "Trimis la verificare";
  }
  return (
    reviewActionLabel[cleaned] ||
    normalized.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function getAvailableActions(status: string): ReviewAction[] {
  if (status === "pending_review") return ["approve", "reject"];
  if (status === "approved") return ["suspend"];
  if (status === "suspended") return ["reinstate"];
  return [];
}

function getInitials(value: string) {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (!words.length) return "P";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function getLocationLabel(provider: ProviderDocument) {
  const coverageArea = provider.professionalProfile?.coverageArea || {};
  const county = readString(coverageArea.countyName) || provider.countyName;
  const city = readString(coverageArea.cityName) || provider.cityName || provider.city;
  return [county, city].filter(Boolean).join(" / ") || "Nu este completat";
}

function getSpecialization(provider: ProviderDocument) {
  return provider.professionalProfile?.specialization || provider.serviceType || "";
}

function getCoverageText(provider: ProviderDocument) {
  return provider.professionalProfile?.coverageAreaText || provider.coverageAreaText || "";
}

function getActiveServices(services?: Array<Record<string, unknown>>) {
  return (services || []).filter((service) => service.status === "active");
}

function getRatingSummary(providerDirectory?: Record<string, unknown> | null) {
  const ratingAverage = readNumber(providerDirectory?.ratingAverage);
  const reviewCount = readNumber(providerDirectory?.reviewCount);
  if (!ratingAverage || !reviewCount) {
    return {
      label: "Nu există rating încă",
      detail: "0 recenzii",
    };
  }
  return {
    label: `${ratingAverage.toFixed(1)} / 5`,
    detail: `${reviewCount} ${reviewCount === 1 ? "recenzie" : "recenzii"}`,
  };
}

function getPublicationMeta(providerDirectory?: Record<string, unknown> | null) {
  if (providerDirectory) {
    return {
      label: "Vizibil în aplicație",
      detail: "Snapshot public disponibil",
      variant: "success" as const,
    };
  }
  return {
    label: "Nepublicat",
    detail: "Nu există snapshot public",
    variant: "outline" as const,
  };
}

function getChecklistItems({
  provider,
  profileOk,
  availabilityOk,
  activeServicesCount,
  identityMeta,
  professionalMeta,
  legalConsentState,
}: {
  provider: ProviderDocument;
  profileOk: boolean;
  availabilityOk: boolean;
  activeServicesCount: number;
  identityMeta: ReturnType<typeof getDocumentMeta>;
  professionalMeta: ReturnType<typeof getDocumentMeta>;
  legalConsentState: ReturnType<typeof getProviderLegalConsentState>;
}) {
  const hasCompanyData = Boolean(
    provider.companyName ||
      provider.professionalProfile?.businessName ||
      provider.cui ||
      provider.tradeRegisterNumber ||
      provider.legalStatus
  );

  return [
    {
      title: "Profil profesional complet",
      detail: profileOk
        ? "Nume public, specializare și zonă completate."
        : "Lipsesc numele public, specializarea sau zona.",
      state: profileOk ? "complete" : "missing",
      badge: profileOk ? "Complet" : "Lipsă",
    },
    {
      title: "Document identitate",
      detail: identityMeta.ok ? "Documentul poate fi verificat de admin." : "Documentul de identitate lipsește.",
      state: identityMeta.ok ? "review" : "missing",
      badge: identityMeta.label,
    },
    {
      title: "Document profesional",
      detail: professionalMeta.ok ? "Documentul profesional este încărcat." : "Certificatul/documentul profesional lipsește.",
      state: professionalMeta.ok ? "review" : "missing",
      badge: professionalMeta.label,
    },
    {
      title: "Disponibilitate configurată",
      detail: availabilityOk ? "Programul este disponibil pentru verificare." : "Nu există disponibilitate configurată.",
      state: availabilityOk ? "complete" : "missing",
      badge: availabilityOk ? "Complet" : "Lipsă",
    },
    {
      title: "Servicii active",
      detail:
        activeServicesCount > 0
          ? `${activeServicesCount} servicii active.`
          : "Providerul nu are servicii publicate încă.",
      state: activeServicesCount > 0 ? "complete" : "missing",
      badge: activeServicesCount > 0 ? "Complet" : "Lipsă",
    },
    {
      title: "Termeni acceptați",
      detail:
        legalConsentState === "accepted"
          ? "Termenii și politica sunt acceptate."
          : legalConsentState === "partial"
            ? "Consimțământul este parțial."
            : "Lipsesc acceptările legale.",
      state: legalConsentState === "accepted" ? "complete" : "missing",
      badge: legalConsentState === "accepted" ? "Complet" : legalConsentState === "partial" ? "Parțial" : "Lipsă",
    },
    {
      title: "Date firmă completate",
      detail: hasCompanyData ? "Există date juridice sau date de firmă." : "Nu există date firmă suficiente.",
      state: hasCompanyData ? "complete" : "missing",
      badge: hasCompanyData ? "Completat" : "Lipsă",
    },
  ] satisfies Array<{
    title: string;
    detail: string;
    state: ChecklistState;
    badge: string;
  }>;
}

function isShortOrTestDescription(value?: string | null) {
  const text = value?.trim() || "";
  if (!text) return true;
  if (text.length < 40) return true;
  return /\b(test|demo|lorem|asdf|temporar|placeholder)\b/i.test(text);
}

function formatBooleanBadge(value: boolean | null | undefined, labels = { yes: "Da", no: "Nu", missing: "Lipsă" }) {
  if (value === true) {
    return { label: labels.yes, variant: "success" as const };
  }
  if (value === false) {
    return { label: labels.no, variant: "secondary" as const };
  }
  return { label: labels.missing, variant: "outline" as const };
}

function hasDate(value: unknown) {
  return typeof value === "string" && value.trim() && formatAdminDateTime(value) !== "-";
}

function formatTimelineActor(
  provider: ProviderDocument,
  actorUid?: string | null,
  actorRole?: string | null
) {
  const role = actorRole?.trim().toLowerCase();
  if (role === "admin") return "Admin";
  if (role === "support") return "Suport";
  if (role === "provider") return "Prestator";
  if (actorUid && actorUid === getProviderId(provider)) return "Prestator";
  if (actorUid && actorUid === provider.adminReview?.reviewedBy) return "Admin";
  return null;
}

function buildTimelineEvents(
  provider: ProviderDocument,
  recentAuditEvents?: Array<Record<string, unknown>>
) {
  const events: TimelineEvent[] = [];

  if (hasDate(provider.createdAt)) {
    events.push({
      id: "created",
      title: "Cont creat",
      at: provider.createdAt,
      description: "Profilul de prestator a fost creat.",
    });
  }

  if (hasDate(provider.documents?.identity?.uploadedAt)) {
    events.push({
      id: "identity-uploaded",
      title: "Document identitate încărcat",
      at: provider.documents?.identity?.uploadedAt,
      description: provider.documents?.identity?.originalFileName || null,
    });
  }

  if (hasDate(provider.documents?.professional?.uploadedAt)) {
    events.push({
      id: "professional-uploaded",
      title: "Document profesional încărcat",
      at: provider.documents?.professional?.uploadedAt,
      description: provider.documents?.professional?.originalFileName || null,
    });
  }

  if (hasDate(provider.reviewState?.submittedAt)) {
    events.push({
      id: "submitted-review",
      title: "Trimis la verificare",
      at: provider.reviewState?.submittedAt,
      description: "Providerul a trimis profilul pentru review.",
    });
  }

  if (hasDate(provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt)) {
    events.push({
      id: "admin-review",
      title: formatReviewAction(provider.adminReview?.action),
      at: provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt,
      actor: formatTimelineActor(provider, provider.adminReview?.reviewedBy, "admin"),
      description: provider.adminReview?.reason || provider.suspension?.reason || null,
    });
  }

  (recentAuditEvents || []).forEach((event, index) => {
    const at = readString(event.createdAt) || readString(event.at);
    const actorUid = readString(event.actorUid);
    const actorRole = readString(event.actorRole);
    events.push({
      id: `audit-${String(event.id || index)}`,
      title: formatActivityLabel(event.action || event.type || event.message),
      at,
      actor: formatTimelineActor(provider, actorUid, actorRole),
      description: readString(event.message) || readString((event.context as Record<string, unknown> | undefined)?.reason) || null,
    });
  });

  return events
    .filter((event) => event.title !== "-" || event.at)
    .sort((a, b) => {
      const aTime = a.at ? Date.parse(a.at) : 0;
      const bTime = b.at ? Date.parse(b.at) : 0;
      return bTime - aTime;
    })
    .slice(0, 10);
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
              placeholder="Scrie motivul care va fi salvat pentru această decizie..."
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

function FieldValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  detail,
  variant = "outline",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  variant?: BadgeVariant;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Badge variant={variant}>{label}</Badge>
      </div>
      <p className="text-lg font-semibold leading-none">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function AvatarPreview({
  src,
  loading,
  name,
  size = "lg",
}: {
  src: string | null;
  loading: boolean;
  name: string;
  size?: "sm" | "lg";
}) {
  const className =
    size === "sm"
      ? "h-16 w-16 text-lg"
      : "h-40 w-full min-w-[160px] max-w-[220px] text-3xl";

  return (
    <div className={`flex ${className} items-center justify-center overflow-hidden rounded-md border border-border bg-muted/30 font-semibold text-muted-foreground`}>
      {loading ? (
        <p className="px-3 text-center text-xs font-normal">Se încarcă...</p>
      ) : src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Imagine profil prestator" className="h-full w-full object-cover" />
        </>
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
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
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewTitle, setDocumentPreviewTitle] = useState("");
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewError, setDocumentPreviewError] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarPreviewLoading, setAvatarPreviewLoading] = useState(false);
  const [avatarPreviewError, setAvatarPreviewError] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

  const provider = getProviderFromCase(data);
  const status = provider ? getStatus(provider) : "";
  const StatusIcon = getStatusIcon(status);
  const availableActions = useMemo(() => getAvailableActions(status), [status]);
  const providerAvatarPath = provider?.professionalProfile?.avatarPath?.trim() || "";

  useEffect(() => {
    let active = true;

    setAvatarPreviewError(null);
    setAvatarPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    if (!id || !providerAvatarPath) {
      setAvatarPreviewLoading(false);
      return () => {
        active = false;
      };
    }

    setAvatarPreviewLoading(true);

    async function loadAvatar() {
      try {
        const res = await adminFetch(`/api/admin/providers/${id}/avatar`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(await readAdminResponseError(res, "Imaginea de profil nu poate fi încărcată."));
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        if (active) {
          setAvatarPreviewUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (err) {
        if (active) {
          setAvatarPreviewError(
            err instanceof Error ? err.message : "Imaginea de profil nu poate fi încărcată."
          );
        }
      } finally {
        if (active) {
          setAvatarPreviewLoading(false);
        }
      }
    }

    void loadAvatar();

    return () => {
      active = false;
    };
  }, [id, providerAvatarPath]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

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

  async function openDocumentPreview(documentType: ProviderDocumentType, title: string) {
    if (!id) return;
    if (documentPreviewUrl) {
      URL.revokeObjectURL(documentPreviewUrl);
    }
    setDocumentPreviewUrl(null);
    setDocumentPreviewError(null);
    setDocumentPreviewTitle(title);
    setDocumentPreviewOpen(true);
    setDocumentPreviewLoading(true);

    try {
      const res = await adminFetch(`/api/admin/providers/${id}/documents/${documentType}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Documentul nu poate fi încărcat."));
      }
      const blob = await res.blob();
      setDocumentPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setDocumentPreviewError(
        err instanceof Error ? err.message : "Documentul nu poate fi încărcat."
      );
    } finally {
      setDocumentPreviewLoading(false);
    }
  }

  function closeDocumentPreview(open: boolean) {
    setDocumentPreviewOpen(open);
    if (!open) {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
      setDocumentPreviewUrl(null);
      setDocumentPreviewError(null);
      setDocumentPreviewLoading(false);
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
            <AdminFormGridSkeleton fields={8} />
          </CardContent>
        </Card>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <AdminFormGridSkeleton fields={6} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <AdminLogStackSkeleton lines={5} />
            </CardContent>
          </Card>
        </div>
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
  const displayName = getDisplayName(provider);
  const specialization = getSpecialization(provider);
  const locationLabel = getLocationLabel(provider);
  const coverageText = getCoverageText(provider);
  const identityMeta = getDocumentMeta(provider.documents?.identity);
  const professionalMeta = getDocumentMeta(provider.documents?.professional);
  const availabilityOk = hasConfiguredAvailability(provider, data?.availability);
  const activeServices = getActiveServices(data?.services);
  const recentBookings = data?.recentBookings || [];
  const ratingSummary = getRatingSummary(data?.providerDirectory);
  const publicationMeta = getPublicationMeta(data?.providerDirectory);
  const profileOk = Boolean(profile.displayName && specialization && coverageText);
  const legalConsentState = getProviderLegalConsentState(provider);
  const legalConsentMeta =
    legalConsentState === "accepted"
      ? { label: "Acceptat", variant: "success" as const }
      : legalConsentState === "partial"
        ? { label: "Parțial", variant: "warning" as const }
        : { label: "Lipsă", variant: "outline" as const };
  const launchContactMeta =
    getProviderLaunchContactConsentState(provider) === "accepted"
      ? { label: "Da", variant: "success" as const }
      : getProviderLaunchContactConsentState(provider) === "declined"
        ? { label: "Nu", variant: "secondary" as const }
        : { label: "Lipsă", variant: "outline" as const };
  const hasApprovedWithoutActiveServices = status === "approved" && activeServices.length === 0;
  const checklist = getChecklistItems({
    provider,
    profileOk,
    availabilityOk,
    activeServicesCount: activeServices.length,
    identityMeta,
    professionalMeta,
    legalConsentState,
  });
  const timelineEvents = buildTimelineEvents(provider, data?.recentAuditEvents);
  const lastActivity = timelineEvents[0]?.at || provider.updatedAt || null;
  const accountantMeta = formatBooleanBadge(
    provider.hasAccountant === "yes" ? true : provider.hasAccountant === "no" ? false : null,
    { yes: "Da", no: "Nu", missing: provider.hasAccountant === "unsure" ? "Încă nu" : "Lipsă" }
  );
  const shortBioWarning = isShortOrTestDescription(profile.shortBio);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <AvatarPreview src={avatarPreviewUrl} loading={avatarPreviewLoading} name={displayName} size="sm" />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-2xl font-semibold">{displayName}</h1>
                  <Badge variant={providerStatusVariant(status)} className="gap-1.5">
                    <StatusIcon className="h-3.5 w-3.5" />
                    {getStatusLabel(status)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatValue(profile.businessName || provider.companyName, "Fără denumire firmă")}
                </p>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                    <span className="truncate">{formatValue(specialization)}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{formatValue(provider.phoneNumber || provider.phone)}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{formatValue(provider.email)}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0" />
                    <span className="truncate">Cod intern: {providerId}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    <span className="truncate">Înscris: {formatAdminDateTime(provider.createdAt)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 lg:items-end">
              <Button variant="outline" asChild>
                <Link href="/admin/prestatori">
                  <ChevronLeft className="h-4 w-4" />
                  Înapoi la listă
                </Link>
              </Button>
              {/* TODO: add public profile preview route when a web-admin route exists. */}
              {/* TODO: add provider edit route when admin editing is supported. */}
              <div className="flex flex-wrap gap-2 lg:justify-end">
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
              {availableActions.length === 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  Nu există acțiuni administrative pentru statusul curent.
                </p>
              )}
            </div>
          </div>
          {actionError && <p className="mt-4 text-sm text-rose-500">{actionError}</p>}
          {avatarPreviewError && <p className="mt-4 text-sm text-amber-700">{avatarPreviewError}</p>}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {hasApprovedWithoutActiveServices && (
        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Provider aprobat, dar fără servicii active. Profilul poate fi incomplet pentru utilizatori.</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Overview provider</CardTitle>
            <CardDescription>Informațiile care contează pentru o decizie rapidă.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <AvatarPreview src={avatarPreviewUrl} loading={avatarPreviewLoading} name={displayName} />
              {providerAvatarPath && avatarPreviewUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => window.open(avatarPreviewUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Deschide imaginea
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldValue label="Specializare" value={formatValue(specialization)} />
              <FieldValue label="Zonă acoperire" value={formatValue(coverageText)} />
              <FieldValue
                label="Tarif de bază"
                value={formatCurrency(profile.baseRateAmount, profile.baseRateCurrency)}
              />
              <FieldValue label="Disponibilitate" value={formatValue(profile.availabilitySummary)} />
              <div className="sm:col-span-2">
                <p className="text-xs uppercase text-muted-foreground">Descriere scurtă</p>
                <p className="mt-1 line-clamp-2 text-sm">
                  {formatValue(profile.shortBio)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sumar operațional</CardTitle>
            <CardDescription>Status publicare, servicii, programări și recenzii.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <SummaryStat
              icon={BriefcaseBusiness}
              label="Servicii active"
              value={activeServices.length > 0 ? String(activeServices.length) : "0"}
              detail={activeServices.length > 0 ? "Servicii publicabile" : "Nu există servicii active"}
              variant={activeServices.length > 0 ? "success" : "warning"}
            />
            <SummaryStat
              icon={CalendarClock}
              label="Programări recente"
              value={recentBookings.length > 0 ? String(recentBookings.length) : "0"}
              detail={recentBookings.length > 0 ? "Booking-uri în case-ul admin" : "Nu există programări recente"}
              variant={recentBookings.length > 0 ? "secondary" : "outline"}
            />
            <SummaryStat
              icon={FileCheck2}
              label="Documente"
              value={`${[identityMeta.ok, professionalMeta.ok].filter(Boolean).length}/2`}
              detail="Documente încărcate pentru verificare"
              variant={identityMeta.ok && professionalMeta.ok ? "success" : "warning"}
            />
            <SummaryStat
              icon={Star}
              label="Rating"
              value={ratingSummary.label}
              detail={ratingSummary.detail}
              variant={ratingSummary.label === "Nu există rating încă" ? "outline" : "success"}
            />
            <div className="sm:col-span-2">
              <SummaryStat
                icon={Eye}
                label="Vizibilitate"
                value={publicationMeta.label}
                detail={publicationMeta.detail}
                variant={publicationMeta.variant}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Verificare prestator</CardTitle>
            <CardDescription>Checklist compact pentru aprobarea sau menținerea profilului.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {checklist.map((item) => {
              const meta = checklistStateMeta[item.state];
              const Icon = item.state === "complete" ? CheckCircle2 : item.state === "review" ? CircleDashed : AlertTriangle;
              return (
                <div key={item.title} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.iconClassName}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <Badge variant={item.state === "complete" ? "success" : item.state === "review" ? "warning" : meta.variant}>
                    {item.badge || meta.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acțiuni administrative</CardTitle>
            <CardDescription>Acțiuni reale disponibile pentru statusul curent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nu există acțiuni disponibile pentru starea curentă.
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
            <p className="text-xs text-muted-foreground">
              Pentru respingere și suspendare, motivul este obligatoriu și este validat și server-side.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil profesional</CardTitle>
          <CardDescription>Datele care definesc profilul public al prestatorului.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {shortBioWarning && (
            <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Descrierea pare incompletă sau de test. Recomandat să fie actualizată înainte de publicare.</p>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold">Identitate publică</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FieldValue label="Nume public" value={formatValue(profile.displayName)} />
              <FieldValue label="Denumire firmă" value={formatValue(profile.businessName)} />
              <FieldValue label="Specializare" value={formatValue(specialization)} />
              <div className="md:col-span-2">
                <FieldValue label="Descriere" value={formatValue(profile.shortBio)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Acoperire și disponibilitate</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FieldValue label="Județ / oraș" value={locationLabel} />
              <FieldValue label="Zonă acoperire" value={formatValue(coverageText)} />
              <div className="md:col-span-2">
                <FieldValue label="Disponibilitate completă" value={formatValue(profile.availabilitySummary)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Tarifare</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <FieldValue
                label="Tarif de bază"
                value={formatCurrency(profile.baseRateAmount, profile.baseRateCurrency)}
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documente și publicare</CardTitle>
          <CardDescription>Documentele rămân separate de starea publicării profilului.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold">Documente</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {([
                ["identity", "Document identitate", provider.documents?.identity, identityMeta],
                ["professional", "Document profesional", provider.documents?.professional, professionalMeta],
              ] as const).map(([type, title, doc, meta]) => (
                <div key={type} className="rounded-md border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        {getDocumentDisplayName(doc)}
                      </p>
                    </div>
                    <Badge variant={meta.variant}>
                      <FileCheck2 className="h-3.5 w-3.5" />
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-md bg-muted/30 p-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <FileSearch className="h-4 w-4" />
                      <span>Încărcat la: {formatAdminDateTime(doc?.uploadedAt)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canViewProviderDocument(doc)}
                      onClick={() => openDocumentPreview(type, title)}
                    >
                      <FileSearch className="h-4 w-4" />
                      Vezi document
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Publicare</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FieldValue label="Status verificare" value={<Badge variant={providerStatusVariant(status)}>{getStatusLabel(status)}</Badge>} />
              <FieldValue
                label="Ultima decizie"
                value={`${formatReviewAction(provider.adminReview?.action)} • ${formatAdminDateTime(provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt)}`}
              />
              <FieldValue label="Ultimul motiv" value={formatCompactValue(provider.adminReview?.reason || provider.suspension?.reason)} />
              <FieldValue label="Publicat la" value={formatAdminDateTime(provider.lastPublishedAt)} />
              <FieldValue label="Actualizat la" value={formatAdminDateTime(provider.updatedAt)} />
              <FieldValue
                label="Vizibilitate în aplicație"
                value={<Badge variant={publicationMeta.variant}>{publicationMeta.label}</Badge>}
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date din înscriere</CardTitle>
          <CardDescription>Informațiile trimise inițial de prestator.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold">Date solicitant</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FieldValue label="Nume complet" value={formatValue(provider.fullName)} />
              <FieldValue label="Telefon" value={formatValue(provider.phoneNumber || provider.phone)} />
              <FieldValue label="Email" value={formatValue(provider.email)} />
              <FieldValue label="Județ / oraș" value={locationLabel} />
              <div className="sm:col-span-2">
                <FieldValue label="Serviciul ales la înscriere" value={formatValue(provider.serviceType)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Date firmă și consimțăminte</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FieldValue
                label="Statut juridic"
                value={provider.legalStatus ? providerLegalStatusLabel[provider.legalStatus] || provider.legalStatus : "Nu este completat"}
              />
              <FieldValue label="CUI" value={formatValue(provider.cui)} />
              <FieldValue label="Nr. Registrul Comerțului" value={formatValue(provider.tradeRegisterNumber)} />
              <FieldValue label="Estimare înființare" value={formatValue(provider.estimatedSetupTimeline)} />
              <FieldValue label="Are contabil" value={<Badge variant={accountantMeta.variant}>{accountantMeta.label}</Badge>} />
              <FieldValue label="Termeni / politică" value={<Badge variant={legalConsentMeta.variant}>{legalConsentMeta.label}</Badge>} />
              <FieldValue label="Acord contact lansare" value={<Badge variant={launchContactMeta.variant}>{launchContactMeta.label}</Badge>} />
              <FieldValue label="Creat la" value={formatAdminDateTime(provider.createdAt)} />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activitate recentă</CardTitle>
          <CardDescription>Evenimentele disponibile în case-ul admin pentru acest provider.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {!timelineEvents.length ? (
              <p className="text-sm text-muted-foreground">Nu există evenimente recente.</p>
            ) : (
              <div className="relative space-y-4 border-l border-border pl-5">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                    <div className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatAdminDateTime(event.at)}</p>
                      </div>
                      {event.actor && (
                        <p className="mt-1 text-xs text-muted-foreground">Actor: {event.actor}</p>
                      )}
                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-border p-4">
            <h3 className="text-sm font-semibold">Sumar activitate</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Servicii active</span>
                <span className="font-medium">{activeServices.length || "Nu există servicii active"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Programări recente</span>
                <span className="font-medium">{recentBookings.length || "Nu există programări recente"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Recenzii</span>
                <span className="font-medium">{ratingSummary.detail}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Ultima activitate</span>
                <span className="text-right font-medium">{formatAdminDateTime(lastActivity)}</span>
              </div>
            </div>
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

      <Dialog open={documentPreviewOpen} onOpenChange={closeDocumentPreview}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{documentPreviewTitle || "Document"}</DialogTitle>
            <DialogDescription>Imagine disponibilă doar pentru administratori.</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-muted/30 p-3">
            {documentPreviewLoading ? (
              <p className="text-sm text-muted-foreground">Se încarcă documentul...</p>
            ) : documentPreviewError ? (
              <p className="text-sm text-rose-500">{documentPreviewError}</p>
            ) : documentPreviewUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={documentPreviewUrl}
                  alt={documentPreviewTitle || "Document prestator"}
                  className="max-h-[70vh] max-w-full rounded-sm object-contain"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Documentul nu poate fi încărcat.</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={!documentPreviewUrl}
              onClick={() => {
                if (documentPreviewUrl) {
                  window.open(documentPreviewUrl, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Deschide în tab nou
            </Button>
            <Button type="button" onClick={() => closeDocumentPreview(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
