import { describe, expect, it } from "vitest";
import {
  buildBookingTimelineEvents,
  formatBookingActivityLabel,
  formatBookingStatusLabel,
  formatPricingContext,
  formatRequestResponseStatus,
  getBookingSummaryMetrics,
  getOperationalBookingState,
  mergeBookingCaseData,
} from "../adminBookingDetail";

describe("adminBookingDetail helpers", () => {
  it("maps booking statuses for admin UX", () => {
    expect(formatBookingStatusLabel("confirmed")).toBe("Confirmată");
    expect(formatBookingStatusLabel("requested")).toBe("În așteptare");
    expect(formatBookingStatusLabel("cancelled_by_admin")).toBe("Anulată");
  });

  it("humanizes audit activity labels", () => {
    expect(formatBookingActivityLabel("payment.stripe_webhook")).toBe("Plată confirmată");
    expect(formatBookingActivityLabel("booking.confirm")).toBe("Programare confirmată");
    expect(formatBookingActivityLabel("booking.create")).toBe("Programare creată");
  });

  it("maps provider response statuses", () => {
    expect(formatRequestResponseStatus("answered")).toBe("Răspuns primit");
    expect(formatRequestResponseStatus("pending")).toBe("În așteptare");
  });

  it("builds operational state for confirmed unpaid bookings", () => {
    expect(
      getOperationalBookingState(
        { status: "confirmed" },
        { status: "unpaid" }
      )
    ).toBe("Confirmată, în așteptarea plății");
  });

  it("formats pricing context without multiplying professionals", () => {
    expect(
      formatPricingContext({
        requestDetails: { estimatedHours: 2, professionalsCount: 3 },
        pricingSnapshot: { ratePerHourPerProfessional: 90 },
      })
    ).toBe("2h × 90 RON");
  });

  it("builds summary metrics", () => {
    const metrics = getBookingSummaryMetrics(
      { status: "confirmed" },
      { status: "paid", amount: 180, currency: "RON" },
      { status: "active" },
      [{ ticketId: "t1", status: "open" }],
      { status: "answered", deadlineAt: "2026-10-24T11:00:00.000Z" }
    );

    expect(metrics.paymentDetail).toBe("Plătită");
    expect(metrics.conversationLabel).toBe("Activă");
    expect(metrics.supportLabel).toBe("1");
    expect(metrics.providerResponseLabel).toBe("Răspuns primit");
  });

  it("merges booking case result after admin action", () => {
    const merged = mergeBookingCaseData(
      {
        booking: {
          bookingId: "booking_1",
          status: "confirmed",
        },
      },
      {
        status: "cancelled_by_admin",
        note: "Anulare admin",
        resolutionStatus: "resolved",
      }
    );

    expect(merged.booking?.status).toBe("cancelled_by_admin");
    expect(merged.booking?.adminCaseSnapshot?.latestNote).toBe("Anulare admin");
    expect(merged.booking?.adminCaseSnapshot?.resolutionStatus).toBe("resolved");
  });

  it("builds timeline events with human titles", () => {
    const events = buildBookingTimelineEvents(
      {
        scheduledStartAt: "2026-10-25T00:30:00.000Z",
        serviceSnapshot: { name: "Curățenie" },
        requestResponse: {
          answeredAt: "2026-10-24T10:15:00.000Z",
        },
      },
      [
        {
          eventId: "evt_1",
          action: "booking.create",
          createdAt: "2026-10-24T09:00:00.000Z",
          result: "success",
        },
      ]
    );

    expect(events.some((event) => event.title === "Programare creată")).toBe(true);
    expect(events.some((event) => event.title === "Răspuns primit de la prestator")).toBe(true);
  });
});
