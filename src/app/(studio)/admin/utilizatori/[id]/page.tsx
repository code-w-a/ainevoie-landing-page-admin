"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminPageHeaderSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildUserTimelineEvents,
  getAccountStatus,
  getUserFromCase,
  getUserId,
  getUserSummaryMetrics,
  mergeUserCaseStateResult,
  readUserStateResult,
  type ResolutionStatus,
  type UserCase,
  type UserStateAction,
} from "@/lib/adminUserDetail";
import { UserAccountManagementCard } from "./components/UserAccountManagementCard";
import { UserDetailHeader } from "./components/UserDetailHeader";
import { UserDetailTabs } from "./components/UserDetailTabs";
import { UserSummaryStrip } from "./components/UserSummaryStrip";
import { UserTechnicalDetails } from "./components/UserTechnicalDetails";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = String(params?.id || "").trim();

  const [data, setData] = useState<UserCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>("open");

  const loadDetails = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      if (!userId) return;
      const showLoading = options.showLoading ?? true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await adminFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(await readAdminResponseError(response, "Nu am putut încărca utilizatorul."));
        }
        const nextData = (await response.json()) as UserCase;
        setData(nextData);
        const snapshotStatus = nextData.user?.adminCaseSnapshot?.resolutionStatus;
        if (
          snapshotStatus === "open" ||
          snapshotStatus === "in_progress" ||
          snapshotStatus === "resolved"
        ) {
          setResolutionStatus(snapshotStatus);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut încărca utilizatorul.");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function changeUserState(action: UserStateAction) {
    if (!userId) return;
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

      const result = readUserStateResult(await response.json());
      if (result && data) {
        setData(mergeUserCaseStateResult(data, result));
      }
      if (action === "disable") {
        setReason("");
      }
      await loadDetails({ showLoading: false });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza starea utilizatorului.");
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  const user = getUserFromCase(data);
  if (error || !user || !data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/utilizatori">Înapoi la utilizatori</Link>
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

  const recentBookings = data.recentBookings || [];
  const recentAuditEvents = data.recentAuditEvents || [];
  const accountStatus = getAccountStatus(user);
  const summaryMetrics = getUserSummaryMetrics(user, recentBookings);
  const timelineEvents = buildUserTimelineEvents(user, recentAuditEvents);

  return (
    <div className="space-y-8">
      <UserDetailHeader
        user={user}
        recentBookings={recentBookings}
        recentAuditEvents={recentAuditEvents}
      />

      <UserSummaryStrip metrics={summaryMetrics} />

      <UserAccountManagementCard
        accountStatus={accountStatus}
        reason={reason}
        note={note}
        resolutionStatus={resolutionStatus}
        pending={pending}
        actionError={actionError}
        onReasonChange={setReason}
        onNoteChange={setNote}
        onResolutionStatusChange={setResolutionStatus}
        onSubmit={changeUserState}
      />

      <UserDetailTabs
        user={user}
        recentBookings={recentBookings}
        timelineEvents={timelineEvents}
      />

      <UserTechnicalDetails
        user={user}
        userId={getUserId(user, userId)}
        recentBookings={recentBookings}
        recentAuditEvents={recentAuditEvents}
      />
    </div>
  );
}
