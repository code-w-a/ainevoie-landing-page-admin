"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import {
  AdminFormGridSkeleton,
  AdminPageHeaderSkeleton,
} from "@/components/admin/AdminSkeletonLayouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DRIFT_SPECIALIZATION_ISSUE,
  getActiveServices,
  getApprovalBlockedReasons,
  getCoverageText,
  getDocumentMeta,
  getLocationLabel,
  getProviderApprovalSummary,
  getProviderFromCase,
  getProviderId,
  getPublicPreviewDrift,
  getSpecialization,
  getStatus,
  hasConfiguredAvailability,
  mergeCaseReviewResult,
  readReviewResult,
  readString,
  shouldShowPublicSyncBanner,
  SUPERADMIN_EMAIL,
  type ProviderCase,
  type ProviderDocumentType,
  type ReviewAction,
  type ReviewResult,
} from "@/lib/adminProviderDetail";
import { DeleteProviderDialog } from "./components/DeleteProviderDialog";
import { DocumentPreviewDialog } from "./components/DocumentPreviewDialog";
import { ProviderDecisionCard } from "./components/ProviderDecisionCard";
import { ProviderDetailHeader } from "./components/ProviderDetailHeader";
import { ProviderDetailTabs } from "./components/ProviderDetailTabs";
import { ProviderPublicSyncBanner } from "./components/ProviderPublicSyncBanner";
import { ProviderSummaryStrip } from "./components/ProviderSummaryStrip";
import { ProviderTechnicalDetails } from "./components/ProviderTechnicalDetails";
import { ReviewDecisionDialog } from "./components/ReviewDecisionDialog";

type AdminSessionResponse = {
  email?: string | null;
};

export default function ProviderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<ProviderCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resyncError, setResyncError] = useState<string | null>(null);
  const [resyncingDirectory, setResyncingDirectory] = useState(false);
  const [dialogAction, setDialogAction] = useState<ReviewAction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentPreviewOpen, setDocumentPreviewOpen] = useState(false);
  const [documentPreviewTitle, setDocumentPreviewTitle] = useState("");
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewLoading, setDocumentPreviewLoading] = useState(false);
  const [documentPreviewError, setDocumentPreviewError] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarPreviewLoading, setAvatarPreviewLoading] = useState(false);
  const [avatarPreviewError, setAvatarPreviewError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const latestReviewResultRef = useRef<ReviewResult | null>(null);

  const loadDetails = useCallback(async (options: { showLoading?: boolean } = {}) => {
    if (!id) return;
    if (latestReviewResultRef.current?.providerId && latestReviewResultRef.current.providerId !== id) {
      latestReviewResultRef.current = null;
    }
    const showLoading = options.showLoading ?? true;
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut încărca fișa prestatorului."));
      }
      const nextData = (await res.json()) as ProviderCase;
      setData(mergeCaseReviewResult(nextData, latestReviewResultRef.current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nu am putut încărca fișa prestatorului.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    let active = true;

    async function loadAdminSession() {
      try {
        const res = await adminFetch("/api/admin/auth/session", { cache: "no-store" });
        if (!res.ok) return;
        const session = (await res.json()) as AdminSessionResponse;
        if (!active) return;
        setAdminEmail(readString(session?.email).toLowerCase() || null);
      } catch {
        if (active) {
          setAdminEmail(null);
        }
      }
    }

    void loadAdminSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (documentPreviewUrl) {
        URL.revokeObjectURL(documentPreviewUrl);
      }
    };
  }, [documentPreviewUrl]);

  const provider = getProviderFromCase(data);
  const status = provider ? getStatus(provider) : "";
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

  async function submitReview(action: ReviewAction, reason: string, overrideIncompleteProfile = false) {
    if (!id) return false;
    setSaving(true);
    setActionError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: reason.trim() || undefined,
          overrideIncompleteProfile: action === "approve" ? overrideIncompleteProfile : undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut procesa decizia."));
      }
      const result = readReviewResult(await res.json().catch(() => null));
      if (result) {
        latestReviewResultRef.current = result;
        setData((current) => mergeCaseReviewResult(current, result, action, reason));
      }
      void loadDetails({ showLoading: false });
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut procesa decizia.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteProvider() {
    if (!id) return false;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut șterge prestatorul."));
      }
      router.replace("/admin/prestatori");
      router.refresh();
      return true;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Nu am putut șterge prestatorul.");
      return false;
    } finally {
      setDeleting(false);
    }
  }

  async function resyncPublicDirectorySnapshot() {
    if (!id) return;
    setResyncingDirectory(true);
    setResyncError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${id}/resync-directory`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut resincroniza profilul public."));
      }
      await loadDetails({ showLoading: false });
    } catch (err) {
      setResyncError(err instanceof Error ? err.message : "Nu am putut resincroniza profilul public.");
    } finally {
      setResyncingDirectory(false);
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

  function openTechnicalDetails() {
    const details = document.getElementById("provider-technical-details");
    if (!(details instanceof HTMLDetailsElement)) {
      return;
    }
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeaderSkeleton />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <AdminFormGridSkeleton fields={6} />
      </div>
    );
  }

  if (!provider || !data) {
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
  const availabilityOk = hasConfiguredAvailability(provider, data.availability);
  const activeServices = getActiveServices(data.services);
  const profileOk = Boolean(profile.displayName && getSpecialization(provider) && getCoverageText(provider));
  const approvalBlockedReasons = getApprovalBlockedReasons({
    profileOk,
    avatarPath: profile.avatarPath,
    identityOk: identityMeta.ok,
    professionalOk: professionalMeta.ok,
    availabilityOk,
    activeServices,
  });
  const approvalSummary = getProviderApprovalSummary(approvalBlockedReasons, status);
  const hasApprovedWithoutActiveServices = status === "approved" && activeServices.length === 0;
  const isSuperAdmin = adminEmail === SUPERADMIN_EMAIL;
  const locationLabel = getLocationLabel(provider);
  const publicPreviewDrift = getPublicPreviewDrift(
    provider,
    data.providerDirectory || null,
    data.services,
    data.availability || null
  );
  const visiblePublicPreviewIssues = isSuperAdmin
    ? publicPreviewDrift.issues
    : publicPreviewDrift.issues.filter((issue) => issue !== DRIFT_SPECIALIZATION_ISSUE);
  const showPublicSyncBanner = shouldShowPublicSyncBanner(status, publicPreviewDrift.hasDrift);

  return (
    <div className="space-y-8">
      <ProviderDetailHeader
        provider={provider}
        status={status}
        avatarPreviewUrl={avatarPreviewUrl}
        avatarPreviewLoading={avatarPreviewLoading}
        saving={saving}
        deleting={deleting}
        isSuperAdmin={isSuperAdmin}
        resyncingDirectory={resyncingDirectory}
        actionError={actionError}
        resyncError={resyncError}
        avatarPreviewError={avatarPreviewError}
        onApprove={() => setDialogAction("approve")}
        onReject={() => setDialogAction("reject")}
        onAction={setDialogAction}
        onDelete={() => {
          setDeleteError(null);
          setDeleteDialogOpen(true);
        }}
        onResync={() => {
          void resyncPublicDirectorySnapshot();
        }}
      />

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {hasApprovedWithoutActiveServices && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Prestator aprobat, dar fără servicii active. Profilul poate fi incomplet pentru clienți.</p>
        </div>
      )}

      <ProviderDecisionCard summary={approvalSummary} />

      {showPublicSyncBanner && (
        <ProviderPublicSyncBanner
          issues={visiblePublicPreviewIssues}
          isSuperAdmin={isSuperAdmin}
          resyncingDirectory={resyncingDirectory}
          onResync={() => {
            void resyncPublicDirectorySnapshot();
          }}
          onOpenTechnicalDetails={openTechnicalDetails}
        />
      )}

      <ProviderSummaryStrip
        activeServicesCount={activeServices.length}
        identityOk={identityMeta.ok}
        professionalOk={professionalMeta.ok}
        availabilityOk={availabilityOk}
        recentBookingsCount={data.recentBookings?.length || 0}
        providerDirectory={data.providerDirectory}
      />

      <ProviderDetailTabs
        provider={provider}
        data={data}
        status={status}
        profileOk={profileOk}
        availabilityOk={availabilityOk}
        activeServicesCount={activeServices.length}
        locationLabel={locationLabel}
        avatarPreviewUrl={avatarPreviewUrl}
        avatarPreviewLoading={avatarPreviewLoading}
        onViewDocument={(type, title) => {
          void openDocumentPreview(type, title);
        }}
      />

      <ProviderTechnicalDetails
        provider={provider}
        providerId={providerId}
        data={data}
        isSuperAdmin={isSuperAdmin}
        resyncingDirectory={resyncingDirectory}
        onResync={() => {
          void resyncPublicDirectorySnapshot();
        }}
      />

      <ReviewDecisionDialog
        action={dialogAction}
        open={Boolean(dialogAction)}
        loading={saving}
        error={actionError}
        approvalWarnings={approvalBlockedReasons}
        onOpenChange={(open) => {
          if (!open) {
            setDialogAction(null);
            setActionError(null);
          }
        }}
        onConfirm={async (reason, overrideIncompleteProfile) => {
          if (!dialogAction) return false;
          return submitReview(dialogAction, reason, overrideIncompleteProfile);
        }}
      />

      <DeleteProviderDialog
        providerId={providerId}
        providerName={provider.professionalProfile?.displayName || provider.email || providerId}
        open={deleteDialogOpen}
        loading={deleting}
        error={deleteError}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setDeleteError(null);
            return;
          }
          setDeleteDialogOpen(true);
        }}
        onConfirm={deleteProvider}
      />

      <DocumentPreviewDialog
        open={documentPreviewOpen}
        title={documentPreviewTitle}
        previewUrl={documentPreviewUrl}
        loading={documentPreviewLoading}
        error={documentPreviewError}
        onOpenChange={closeDocumentPreview}
      />
    </div>
  );
}
