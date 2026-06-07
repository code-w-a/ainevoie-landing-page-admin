"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import type { BookingCase, ResolutionStatus } from "@/lib/adminBookingDetail";

export function useBookingCase(bookingId: string) {
  const [data, setData] = useState<BookingCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (options: { showLoading?: boolean } = {}) => {
      if (!bookingId) return;
      const showLoading = options.showLoading ?? true;
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      try {
        const response = await adminFetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(await readAdminResponseError(response, "Nu am putut încărca programarea."));
        }
        setData((await response.json()) as BookingCase);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nu am putut încărca programarea.");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [bookingId]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}

export function readInitialResolutionStatus(data: BookingCase | null): ResolutionStatus {
  const snapshotStatus = data?.booking?.adminCaseSnapshot?.resolutionStatus;
  if (
    snapshotStatus === "open" ||
    snapshotStatus === "in_progress" ||
    snapshotStatus === "resolved"
  ) {
    return snapshotStatus;
  }
  return "open";
}

export function readInitialLinkedTicketId(data: BookingCase | null) {
  const linkedTickets = data?.booking?.adminCaseSnapshot?.linkedTicketIds;
  if (Array.isArray(linkedTickets) && linkedTickets[0]) {
    return String(linkedTickets[0]);
  }
  return "";
}
