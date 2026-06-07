import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useParamsMock = vi.fn();
const useBookingCaseMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: useParamsMock,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("../useBookingCase", () => ({
  useBookingCase: useBookingCaseMock,
  readInitialResolutionStatus: () => "open",
  readInitialLinkedTicketId: () => "",
}));

vi.mock("@/components/admin/AdminEntityLookup", () => ({
  AdminEntityLookup: ({ value }: { value?: string }) =>
    React.createElement("div", { "data-linked-ticket": value || "" }, "lookup"),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabList: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
  TabTrigger: ({ children }: { children: React.ReactNode }) => React.createElement("button", null, children),
  TabContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => React.createElement("span", null, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    asChild,
    children,
    ...props
  }: { asChild?: boolean; children: React.ReactNode } & Record<string, unknown>) => {
    if (asChild) {
      return React.createElement(React.Fragment, null, children);
    }
    return React.createElement("button", props, children);
  },
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => React.createElement("section", null, children),
  CardHeader: ({ children }: { children: React.ReactNode }) => React.createElement("header", null, children),
  CardTitle: ({ children }: { children: React.ReactNode }) => React.createElement("h2", null, children),
  CardDescription: ({ children }: { children: React.ReactNode }) => React.createElement("p", null, children),
  CardContent: ({ children }: { children: React.ReactNode }) => React.createElement("div", null, children),
}));

const baseCase = {
  booking: {
    bookingId: "booking_77",
    status: "cancelled_by_admin",
    userId: "user_1",
    providerId: "provider_1",
    scheduledStartAt: "2026-10-25T00:30:00.000Z",
    scheduledEndAt: "2026-10-25T02:30:00.000Z",
    timezone: "Europe/Bucharest",
    requestDetails: {
      description: "Client requested help before admin cancellation.",
      estimatedHours: 2,
      professionalsCount: 3,
    },
    pricingSnapshot: {
      amount: 180,
      currency: "RON",
      estimatedHours: 2,
      professionalsCount: 3,
      ratePerHourPerProfessional: 90,
    },
    paymentSummary: {
      paymentId: "pay_booking_77",
      status: "failed",
    },
    userSnapshot: {
      displayName: "Client One",
      email: "client.one@example.com",
    },
    providerSnapshot: {
      displayName: "Casa in Ordine",
      email: "provider.one@example.com",
    },
    serviceSnapshot: {
      name: "Curatenie generala",
    },
    requestResponse: {
      status: "answered",
      deadlineAt: "2026-10-24T11:00:00.000Z",
      answeredAt: "2026-10-24T10:15:00.000Z",
    },
  },
  payment: {
    paymentId: "pay_booking_77",
    status: "failed",
    amount: 180,
    currency: "RON",
    processor: "demo",
    method: "demo",
  },
  provider: {
    professionalProfile: {
      displayName: "Casa in Ordine",
    },
  },
  user: {
    email: "client.one@example.com",
  },
  conversation: null,
  review: null,
  supportTickets: [],
  recentAuditEvents: [],
};

describe("Admin booking detail page", () => {
  beforeEach(() => {
    vi.resetModules();
    useParamsMock.mockReturnValue({ id: "booking_77" });
    useBookingCaseMock.mockReturnValue({
      loading: false,
      error: null,
      data: baseCase,
      reload: vi.fn(),
      setData: vi.fn(),
    });
  });

  it("renders cancelled_by_admin booking detail state with the corrected pricing formula", async () => {
    const pageModule = await import("../page");
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain("Anulată");
    expect(html).toContain("2h × 90 RON");
    expect(html).not.toContain("2h × 90 × 3 pers");
    expect(html).toContain("Anulează programarea");
    expect(html).toContain("Detalii tehnice");
  });

  it("renders confirmed unpaid bookings as awaiting payment without changing backend status", async () => {
    useBookingCaseMock.mockReturnValue({
      loading: false,
      error: null,
      data: {
        ...baseCase,
        booking: {
          ...baseCase.booking,
          bookingId: "booking_88",
          status: "confirmed",
          paymentSummary: {
            paymentId: "pay_booking_88",
            status: "unpaid",
          },
          requestDetails: {
            description: "Client requested checkout after confirm.",
            estimatedHours: 2,
            professionalsCount: 1,
          },
        },
        payment: {
          paymentId: "pay_booking_88",
          status: "unpaid",
          amount: 180,
          currency: "RON",
          processor: "stripe",
          method: "card",
        },
      },
      reload: vi.fn(),
      setData: vi.fn(),
    });

    const pageModule = await import("../page");
    const html = renderToStaticMarkup(React.createElement(pageModule.default));

    expect(html).toContain("Confirmată");
    expect(html).toContain("Confirmată, în așteptarea plății");
  });
});
