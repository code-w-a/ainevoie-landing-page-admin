"use client";

import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { runAdminBulkDelete, useAdminBulkSelection } from "@/components/admin/useAdminBulkSelection";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type LegalConsentState = "accepted" | "partial" | "missing";

type UserListItem = {
  userId?: string;
  id?: string;
  accountStatus?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  locale?: string | null;
  primaryLocationLabel?: string | null;
  legalConsentState?: LegalConsentState | string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

type UsersResponse = {
  total?: number;
  items: UserListItem[];
};

function getUserId(item: UserListItem) {
  return item.userId || item.id || "";
}

function getLegalConsentMeta(state?: string | null) {
  if (state === "accepted") {
    return { label: "Acceptat", variant: "success" as const };
  }
  if (state === "partial") {
    return { label: "Parțial", variant: "warning" as const };
  }
  return { label: "Lipsă", variant: "outline" as const };
}

function getAccountStatusMeta(status?: string | null) {
  if (status === "disabled") {
    return { label: "Dezactivat", variant: "danger" as const };
  }
  return { label: "Activ", variant: "success" as const };
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    return `/api/admin/users?${params.toString()}`;
  }, [debouncedQ]);

  const { data, loading, error, reload } = useAdminData<UsersResponse>(endpoint);
  const items = data?.items || [];
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [bulkActionSummary, setBulkActionSummary] = useState<string | null>(null);
  const [bulkActionHasFailures, setBulkActionHasFailures] = useState(false);
  const pageIds = useMemo(
    () => items.map((item) => getUserId(item)).filter(Boolean),
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

  async function deleteUserFromList() {
    if (!deleteTarget?.id) return false;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await adminFetch(`/api/admin/users/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(await readAdminResponseError(res, "Nu am putut șterge utilizatorul."));
      }
      const deletedName = deleteTarget.name;
      setDeleteTarget(null);
      setDeleteSuccess(`Utilizatorul "${deletedName}" a fost șters definitiv.`);
      await reload();
      return true;
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Nu am putut șterge utilizatorul.");
      return false;
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
      const result = await runAdminBulkDelete(ids, async (userId) => {
        const res = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          return {
            ok: false as const,
            message: await readAdminResponseError(res, "Nu am putut șterge utilizatorul."),
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
        setBulkActionSummary(`${successCount} utilizatori au fost șterși.`);
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
        <h1 className="text-2xl font-semibold">Utilizatori</h1>
        <p className="text-sm text-muted-foreground">
          Conturi de tip utilizator și statusul consimțămintelor legale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Căutare</CardTitle>
          <CardDescription>Caută după nume, email, telefon, locație sau ID.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Căutare utilizator"
            value={q}
            disabled={loading}
            onChange={(event) => setQ(event.target.value)}
          />
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setQ("")}
          >
            Resetează
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista utilizatori</CardTitle>
              <CardDescription>{data?.total ?? items.length} rezultate</CardDescription>
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
            <AdminTableSkeleton rows={10} columns={8} />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={allSelected}
                      onChange={(event) => toggleSelectAll(event.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status cont</TableHead>
                  <TableHead>Consimțăminte</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Activitate</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Nu există utilizatori pentru filtrele curente.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => {
                  const userId = getUserId(item);
                  const legalMeta = getLegalConsentMeta(item.legalConsentState);
                  const accountMeta = getAccountStatusMeta(item.accountStatus);

                  return (
                    <TableRow key={userId || item.email || item.phoneNumber}>
                      <TableCell>
                        <Checkbox
                          checked={userId ? selectedIds.has(userId) : false}
                          onChange={(event) =>
                            userId ? toggleRow(userId, event.target.checked) : undefined
                          }
                          disabled={!userId}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {humanUserLabel({
                            displayName: item.displayName,
                            email: item.email,
                            phoneNumber: item.phoneNumber,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">{userId || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.email || "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.phoneNumber || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={accountMeta.variant}>{accountMeta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={legalMeta.variant}>{legalMeta.label}</Badge>
                      </TableCell>
                      <TableCell>{item.primaryLocationLabel || "-"}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div>Creat: {formatAdminDateTime(item.createdAt)}</div>
                          <div>Login: {formatAdminDateTime(item.lastLoginAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!userId || deleting || pendingBulkDelete}
                            onClick={() => {
                              setDeleteSuccess(null);
                              setDeleteError(null);
                              setDeleteTarget({
                                id: userId,
                                name: item.displayName || item.email || userId,
                              });
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Șterge
                          </Button>
                          <Button size="sm" variant="outline" asChild disabled={!userId}>
                            <Link href={`/admin/utilizatori/${userId}`}>
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
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (deleting) return;
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title="Ștergi definitiv utilizatorul?"
        description={
          <div className="space-y-2">
            <p>
              Utilizator: <strong>{deleteTarget?.name || "—"}</strong>. Acțiunea este
              ireversibilă.
            </p>
            {deleteError ? <p className="text-sm text-rose-500">{deleteError}</p> : null}
          </div>
        }
        confirmLabel="Șterge definitiv"
        variant="destructive"
        confirmDisabled={!deleteTarget}
        onConfirm={deleteUserFromList}
      />
      <AdminConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={(open) => {
          if (!pendingBulkDelete) {
            setBulkDeleteConfirmOpen(open);
          }
        }}
        title="Ștergi utilizatorii selectați?"
        description={`Vor fi șterse ${selectedCount} elemente selectate.`}
        confirmLabel="Șterge selecția"
        variant="destructive"
        confirmDisabled={selectedCount === 0}
        onConfirm={handleBulkDeleteConfirmed}
      />
    </div>
  );
}
