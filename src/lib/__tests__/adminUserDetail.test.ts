import { describe, expect, it } from "vitest";
import {
  buildUserTimelineEvents,
  countSuccessfulPayments,
  extractPaymentsFromBookings,
  formatPaymentStatusLabel,
  formatResolutionStatusLabel,
  formatUserActivityLabel,
  formatUserBookingStatusLabel,
  getAccountStatusLabel,
  getAvailableUserActions,
  getLegalConsentLabel,
  getUserSummaryMetrics,
  mergeUserCaseStateResult,
} from "../adminUserDetail";

describe("adminUserDetail helpers", () => {
  it("maps account and consent labels", () => {
    expect(getAccountStatusLabel("active")).toBe("Activ");
    expect(getAccountStatusLabel("disabled")).toBe("Dezactivat");
    expect(getLegalConsentLabel("accepted")).toBe("Acceptate");
    expect(getLegalConsentLabel("partial")).toBe("Parțiale");
  });

  it("maps booking and payment statuses for admin UX", () => {
    expect(formatUserBookingStatusLabel("confirmed")).toBe("Confirmată");
    expect(formatUserBookingStatusLabel("requested")).toBe("În așteptare");
    expect(formatUserBookingStatusLabel("cancelled_by_user")).toBe("Anulată");
    expect(formatPaymentStatusLabel("paid")).toBe("Reușită");
    expect(formatPaymentStatusLabel("failed")).toBe("Eșuată");
    expect(formatPaymentStatusLabel("in_progress")).toBe("În așteptare");
  });

  it("humanizes audit activity labels", () => {
    expect(formatUserActivityLabel("payment.stripe_webhook")).toBe("Plată confirmată");
    expect(formatUserActivityLabel("booking.confirm")).toBe("Programare confirmată");
    expect(formatUserActivityLabel("booking.create")).toBe("Programare creată");
    expect(formatUserActivityLabel("user.account_state_change")).toBe("Stare cont actualizată");
  });

  it("builds summary metrics from user case data", () => {
    const metrics = getUserSummaryMetrics(
      {
        accountStatus: "active",
        legalConsentState: "accepted",
      },
      [
        {
          bookingId: "b1",
          paymentSummary: { status: "paid", amount: 120, currency: "RON" },
        },
        {
          bookingId: "b2",
          paymentSummary: { status: "failed", amount: 80, currency: "RON" },
        },
      ]
    );

    expect(metrics.accountStatusLabel).toBe("Activ");
    expect(metrics.bookingsCount).toBe(2);
    expect(metrics.paymentsLabel).toBe("1 reușită");
    expect(metrics.consentsLabel).toBe("Acceptate");
  });

  it("extracts payments from bookings", () => {
    const payments = extractPaymentsFromBookings([
      {
        bookingId: "booking_1",
        serviceSnapshot: { title: "Curățenie" },
        paymentSummary: {
          status: "paid",
          amount: 150,
          currency: "RON",
          method: "card",
          paymentId: "pay_1",
        },
        updatedAt: "2026-01-10T10:00:00.000Z",
      },
    ]);

    expect(payments).toHaveLength(1);
    expect(payments[0]?.serviceName).toBe("Curățenie");
    expect(payments[0]?.statusLabel).toBe("Reușită");
    expect(payments[0]?.paymentId).toBe("pay_1");
  });

  it("returns only the relevant user management action", () => {
    expect(getAvailableUserActions("active")).toEqual(["disable"]);
    expect(getAvailableUserActions("disabled")).toEqual(["enable"]);
  });

  it("maps resolution status labels", () => {
    expect(formatResolutionStatusLabel("open")).toBe("Deschis");
    expect(formatResolutionStatusLabel("resolved")).toBe("Închis");
  });

  it("merges user state result into case data", () => {
    const merged = mergeUserCaseStateResult(
      {
        user: {
          userId: "u1",
          accountStatus: "active",
        },
      },
      {
        accountStatus: "disabled",
        note: "Abuz raportat",
        resolutionStatus: "open",
        updatedAt: "2026-01-11T12:00:00.000Z",
      }
    );

    expect(merged.user?.accountStatus).toBe("disabled");
    expect(merged.user?.adminCaseSnapshot?.latestNote).toBe("Abuz raportat");
    expect(merged.user?.adminCaseSnapshot?.resolutionStatus).toBe("open");
  });

  it("builds timeline events with human titles", () => {
    const events = buildUserTimelineEvents(
      {
        createdAt: "2026-01-01T10:00:00.000Z",
        lastLoginAt: "2026-01-09T10:00:00.000Z",
      },
      [
        {
          eventId: "evt_1",
          action: "booking.create",
          createdAt: "2026-01-08T10:00:00.000Z",
          result: "success",
        },
      ]
    );

    expect(events[0]?.title).toBe("Ultima autentificare");
    expect(events.some((event) => event.title === "Programare creată")).toBe(true);
    expect(countSuccessfulPayments([{ paymentSummary: { status: "paid" } }])).toBe(1);
  });
});
