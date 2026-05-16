"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminFormGridSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LegalConsentState = "accepted" | "partial" | "missing";

type UserDocument = {
  userId?: string;
  uid?: string;
  role?: string;
  accountStatus?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  locale?: string | null;
  authProviders?: string[];
  primaryLocation?: {
    formattedAddress?: string | null;
  } | null;
  legalConsentState?: LegalConsentState | string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  legalConsentSource?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
};

type BookingListItem = {
  bookingId?: string;
  status?: string | null;
  providerId?: string | null;
  scheduledStartAt?: string | null;
  userSnapshot?: {
    displayName?: string | null;
  };
  providerSnapshot?: {
    displayName?: string | null;
    businessName?: string | null;
  };
  serviceSnapshot?: {
    title?: string | null;
    name?: string | null;
  };
};

type AuditEventItem = {
  eventId?: string;
  action?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  result?: string | null;
  createdAt?: string | null;
};

type UserCaseResponse = {
  user?: UserDocument | null;
  recentBookings?: BookingListItem[];
  recentAuditEvents?: AuditEventItem[];
};

function formatValue(value: unknown, fallback = "-") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
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

function FieldValue({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = String(params?.id || "").trim();
  const endpoint = useMemo(() => `/api/admin/users/${userId}`, [userId]);
  const { data, loading, error } = useAdminData<UserCaseResponse>(endpoint);
  const user = data?.user || null;
  const legalMeta = getLegalConsentMeta(user?.legalConsentState);
  const accountMeta = getAccountStatusMeta(user?.accountStatus);
  const recentBookings = data?.recentBookings || [];
  const recentAuditEvents = data?.recentAuditEvents || [];
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<"open" | "in_progress" | "resolved">("open");

  async function changeUserState(action: "disable" | "enable") {
    setPending(true);
    setActionError(null);
    try {
      const response = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "disable" ? reason.trim() : undefined,
          note: note.trim() || undefined,
          resolutionStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza starea utilizatorului."));
      }

      window.location.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza starea utilizatorului.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <AdminFormGridSkeleton fields={8} />;
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/utilizatori">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la utilizatori
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Nu am putut încărca utilizatorul</CardTitle>
            <CardDescription>{error || "Profilul utilizatorului nu există."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/utilizatori">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Înapoi
            </Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold">
            {humanUserLabel({
              displayName: user.displayName,
              email: user.email,
              phoneNumber: user.phoneNumber,
            })}
          </h1>
          <p className="text-sm text-muted-foreground">ID: {user.userId || user.uid || userId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={accountMeta.variant}>{accountMeta.label}</Badge>
          <Badge variant={legalMeta.variant}>Consimțăminte: {legalMeta.label}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date cont</CardTitle>
          <CardDescription>Profilul Firestore al utilizatorului.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="Nume" value={formatValue(user.displayName)} />
          <FieldValue label="Email" value={formatValue(user.email)} />
          <FieldValue label="Telefon" value={formatValue(user.phoneNumber)} />
          <FieldValue label="Rol" value={formatValue(user.role, "user")} />
          <FieldValue label="Limbă" value={formatValue(user.locale)} />
          <FieldValue label="Metode auth" value={user.authProviders?.length ? user.authProviders.join(", ") : "-"} />
          <FieldValue label="Locație" value={formatValue(user.primaryLocation?.formattedAddress)} />
          <FieldValue label="Creat la" value={formatAdminDateTime(user.createdAt)} />
          <FieldValue label="Ultimul login" value={formatAdminDateTime(user.lastLoginAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acțiuni administrative</CardTitle>
          <CardDescription>Disable/enable cont cu context de caz intern.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Motiv (obligatoriu la disable)"
              value={reason}
              disabled={pending}
              onChange={(event) => setReason(event.target.value)}
            />
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Notă internă"
              value={note}
              disabled={pending}
              onChange={(event) => setNote(event.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={resolutionStatus}
              disabled={pending}
              onChange={(event) => setResolutionStatus(event.target.value as "open" | "in_progress" | "resolved")}
            >
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={pending || !reason.trim()}
              onClick={() => {
                void changeUserState("disable");
              }}
            >
              Disable user
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => {
                void changeUserState("enable");
              }}
            >
              Enable user
            </Button>
          </div>
          {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consimțăminte legale</CardTitle>
          <CardDescription>Acceptările salvate la crearea contului.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue
            label="Termeni acceptați"
            value={`${formatAdminDateTime(user.termsAcceptedAt)} · versiune ${user.termsVersion || "-"}`}
          />
          <FieldValue
            label="Politică acceptată"
            value={`${formatAdminDateTime(user.privacyAcceptedAt)} · versiune ${user.privacyVersion || "-"}`}
          />
          <FieldValue label="Status" value={<Badge variant={legalMeta.variant}>{legalMeta.label}</Badge>} />
          <FieldValue label="Sursă" value={formatValue(user.legalConsentSource)} />
          <FieldValue label="Actualizat la" value={formatAdminDateTime(user.updatedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programări recente</CardTitle>
          <CardDescription>Ultimele programări asociate utilizatorului.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programare</TableHead>
                <TableHead>Prestator</TableHead>
                <TableHead>Serviciu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nu există programări recente.
                  </TableCell>
                </TableRow>
              )}
              {recentBookings.map((booking) => (
                <TableRow key={booking.bookingId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      {formatAdminDateTime(booking.scheduledStartAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">{booking.bookingId}</div>
                  </TableCell>
                  <TableCell>
                    {humanProviderLabel({
                      displayName: booking.providerSnapshot?.displayName,
                      businessName: booking.providerSnapshot?.businessName,
                    })}
                  </TableCell>
                  <TableCell>{booking.serviceSnapshot?.title || booking.serviceSnapshot?.name || "-"}</TableCell>
                  <TableCell>{booking.status || "-"}</TableCell>
                  <TableCell className="text-right">
                    {booking.bookingId ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/programari/${booking.bookingId}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          Detalii
                        </Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit recent</CardTitle>
          <CardDescription>Evenimente asociate utilizatorului.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAuditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există evenimente de audit.</p>
          ) : (
            <div className="space-y-3">
              {recentAuditEvents.map((event) => (
                <div key={event.eventId} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">{event.action || "-"}</div>
                  <div className="mt-1 text-muted-foreground">
                    {formatAdminDateTime(event.createdAt)} · {event.resourceType || "-"} · {event.result || "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
