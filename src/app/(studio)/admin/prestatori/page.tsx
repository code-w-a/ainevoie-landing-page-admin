"use client";

import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanProviderLabel } from "@/lib/adminHumanize";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  identityDocumentStatus?: string | null;
  professionalDocumentStatus?: string | null;
  createdAt?: string | null;
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

  const { data, loading, error, reload } = useAdminData<ProvidersResponse>(endpoint);
  const items = data?.items || [];
  const pagination = data?.pagination;
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const pageIds = useMemo(
    () => items.map((item) => getProviderId(item)).filter(Boolean),
    [items]
  );
  const {
    selectedIds,
    selectedCount,
    allSelected,
    toggleSelectAll,
    toggleRow,
    clearSelection,
    setSelectedIds,
  } = useAdminBulkSelection(pageIds, [endpoint]);

  const canDeleteConfirm = Boolean(
    deleteTarget
      && deleteConfirmation.trim() === deleteTarget.id
  );

  async function deleteProviderFromList() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminFetch(`/api/admin/providers/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut șterge prestatorul."));
      }
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      setDeleteConfirmation("");
      setDeleteSuccess(`Prestatorul "${deletedName}" a fost șters definitiv.`);
      await reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Nu am putut șterge prestatorul.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDeleteConfirmed() {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      return false;
    }

    setPendingBulkDelete(true);
    setBulkActionError(null);
    setBulkActionSummary(null);
    setBulkActionHasFailures(false);
    setDeleteSuccess(null);

    try {
      const result = await runAdminBulkDelete(ids, async (providerId) => {
        const res = await adminFetch(`/api/admin/providers/${encodeURIComponent(providerId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(res, "Nu am putut șterge prestatorul."),
          };
        }
        return { ok: true as const };
      });

      const successCount = result.successIds.length;
      const failureCount = result.failures.length;

      if (failureCount > 0) {
        setBulkActionHasFailures(true);
        setBulkActionSummary(`Ștergere parțială: ${successCount} șterși, ${failureCount} eșuați.`);
        setBulkActionError(`ID-uri eșuate: ${result.failures.map((item) => item.id).join(", ")}`);
        setSelectedIds(new Set(result.failures.map((item) => item.id)));
      } else {
        setBulkActionSummary(`${successCount} prestatori au fost șterși.`);
        clearSelection();
      }

      await reload();
      setBulkDeleteConfirmOpen(false);
      return true;
    } finally {
      setPendingBulkDelete(false);
    }
  }

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista prestatori</CardTitle>
              <CardDescription>{pagination?.total || items.length} rezultate</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={loading || selectedCount === 0 || pendingBulkDelete}
              onClick={() => setBulkDeleteConfirmOpen(true)}
            >
              Șterge selecția
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}
          {bulkActionSummary ? (
            <p className={`mb-4 text-sm ${bulkActionHasFailures ? "text-amber-700" : "text-emerald-700"}`}>
              {bulkActionSummary}
            </p>
          ) : null}
          {bulkActionError && <p className="mb-4 text-sm text-rose-500">{bulkActionError}</p>}
          {deleteSuccess && <p className="mb-4 text-sm text-emerald-700">{deleteSuccess}</p>}

          {loading ?
            <AdminTableSkeleton rows={12} columns={9} />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Specializare</TableHead>
                  <TableHead>Zonă</TableHead>
                  <TableHead>Document identitate</TableHead>
                  <TableHead>Document profesional</TableHead>
                  <TableHead>Data creare cont</TableHead>
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

                  return (
                    <TableRow key={providerId || item.email || item.displayName}>
                      <TableCell>
                        <Checkbox
                          checked={providerId ? selectedIds.has(providerId) : false}
                          onChange={(event) =>
                            providerId ? toggleRow(providerId, event.target.checked) : undefined
                          }
                          disabled={!providerId}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {humanProviderLabel({
                            displayName: item.displayName,
                            businessName: item.businessName,
                            email: item.email,
                            phoneNumber: item.phoneNumber,
                          })}
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
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAdminDateTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!providerId || deleting || pendingBulkDelete}
                            onClick={() => {
                              setDeleteSuccess(null);
                              setDeleteError(null);
                              setDeleteConfirmation("");
                              setDeleteTarget({
                                id: providerId,
                                name: item.displayName || item.businessName || providerId,
                              });
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge
                          </Button>
                          <Button size="sm" variant="outline" asChild disabled={!providerId}>
                            <Link href={`/admin/prestatori/${providerId}`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Detalii
                            </Link>
                          </Button>
                        </div>
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

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (deleting) return;
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmation("");
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Șterge definitiv prestatorul</DialogTitle>
            <DialogDescription>
              Această acțiune este ireversibilă. Tastează codul intern pentru confirmare.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <p className="font-medium">{deleteTarget?.name || "-"}</p>
            <p className="mt-1 text-muted-foreground">Cod intern: {deleteTarget?.id || "-"}</p>
          </div>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={deleteConfirmation}
            disabled={deleting}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={deleteTarget?.id || ""}
          />
          {deleteError && <p className="text-sm text-rose-500">{deleteError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirmation("");
                setDeleteError(null);
              }}
            >
              Anulează
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!canDeleteConfirm || deleting}
              onClick={() => {
                void deleteProviderFromList();
              }}
            >
              {deleting ? "Se șterge..." : "Șterge definitiv"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi prestatorii selectați?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={handleBulkDeleteConfirmed}
      />
    </div>
  );
}
