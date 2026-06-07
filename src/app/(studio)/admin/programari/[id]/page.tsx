"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminPageHeaderSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buildBookingTimelineEvents,
  getBookingFromCase,
  getBookingId,
  getBookingSummaryMetrics,
  getConversationId,
  getPaymentFromCase,
  getPaymentLookupId,
  mergeBookingCaseData,
  readBookingCaseResult,
  type ResolutionStatus,
} from "@/lib/adminBookingDetail";
import { BookingAdminActionsCard } from "./components/BookingAdminActionsCard";
import { BookingDetailHeader } from "./components/BookingDetailHeader";
import { BookingDetailTabs } from "./components/BookingDetailTabs";
import { BookingSummaryStrip } from "./components/BookingSummaryStrip";
import { BookingTechnicalDetails } from "./components/BookingTechnicalDetails";
import {
  readInitialLinkedTicketId,
  readInitialResolutionStatus,
  useBookingCase,
} from "./useBookingCase";

export default function AdminBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingId = decodeURIComponent(params.id || "");

  const { data, loading, error, reload, setData } = useBookingCase(bookingId);
  const [pendingAction, setPendingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState<ResolutionStatus>("open");
  const [linkedTicketId, setLinkedTicketId] = useState("");
  const [initializedCaseMeta, setInitializedCaseMeta] = useState(false);

  useEffect(() => {
    if (!data || initializedCaseMeta) {
      return;
    }
    setResolutionStatus(readInitialResolutionStatus(data));
    setLinkedTicketId(readInitialLinkedTicketId(data));
    setInitializedCaseMeta(true);
  }, [data, initializedCaseMeta]);

  async function patchBookingCase(action: "cancel" | "update_case") {
    setPendingAction(true);
    setActionError(null);
    try {
      const response = await adminFetch(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/admin-case`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reason: action === "cancel" ? reason.trim() : undefined,
            note: note.trim() || undefined,
            resolutionStatus,
            linkedTicketIds: linkedTicketId ? [linkedTicketId] : [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza cazul programării."));
      }

      const result = readBookingCaseResult(await response.json());
      if (result && data) {
        setData(mergeBookingCaseData(data, result));
      }
      if (action === "cancel") {
        setReason("");
      }
      await reload({ showLoading: false });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Nu am putut actualiza cazul programării."
      );
    } finally {
      setPendingAction(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  const booking = getBookingFromCase(data);
  if (error || !booking || !data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/admin/programari">Înapoi la programări</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Nu am putut încărca programarea</CardTitle>
            <CardDescription>{error || "Programarea nu a fost găsită."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const payment = getPaymentFromCase(data, booking);
  const supportTickets = data.supportTickets || [];
  const auditEvents = data.recentAuditEvents || [];
  const conversation = data.conversation || null;
  const conversationId = getConversationId(getBookingId(booking, bookingId), conversation);
  const paymentLookupId = getPaymentLookupId(payment, getBookingId(booking, bookingId));
  const reviewId = String(data.review?.reviewId || data.review?.id || "");
  const summaryMetrics = getBookingSummaryMetrics(
    booking,
    payment,
    conversation,
    supportTickets,
    booking.requestResponse
  );
  const timelineEvents = buildBookingTimelineEvents(booking, auditEvents);

  return (
    <div className="space-y-8">
      <BookingDetailHeader
        booking={booking}
        payment={payment}
        user={data.user}
        provider={data.provider}
        conversationId={conversationId}
        paymentLookupId={paymentLookupId}
        reviewId={reviewId || null}
      />

      <BookingSummaryStrip metrics={summaryMetrics} />

      <BookingDetailTabs
        booking={booking}
        payment={payment}
        user={data.user}
        provider={data.provider}
        conversation={conversation}
        conversationId={conversationId}
        supportTickets={supportTickets}
        review={data.review}
        timelineEvents={timelineEvents}
      />

      <BookingAdminActionsCard
        reason={reason}
        note={note}
        resolutionStatus={resolutionStatus}
        linkedTicketId={linkedTicketId}
        pending={pendingAction}
        actionError={actionError}
        onReasonChange={setReason}
        onNoteChange={setNote}
        onResolutionStatusChange={setResolutionStatus}
        onLinkedTicketChange={setLinkedTicketId}
        onCancel={() => {
          void patchBookingCase("cancel");
        }}
        onSaveCase={() => {
          void patchBookingCase("update_case");
        }}
      />

      <BookingTechnicalDetails
        booking={booking}
        bookingId={getBookingId(booking, bookingId)}
        payment={payment}
        conversation={conversation}
        conversationId={conversationId}
        review={data.review}
        supportTickets={supportTickets}
        auditEvents={auditEvents}
      />
    </div>
  );
}
