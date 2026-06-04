import { expect, test } from "@playwright/test";
import { BOOKING_SMOKE_ACCOUNTS } from "../../../scripts/booking-smoke-config.mjs";

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function buildListItem(overrides: Record<string, unknown>) {
  return {
    bookingId: "bk_base",
    status: "requested",
    userId: "user_1",
    providerId: "provider_1",
    serviceId: "service_cleaning",
    scheduledStartAt: "2026-10-26T07:00:00.000Z",
    scheduledEndAt: "2026-10-26T09:00:00.000Z",
    requestDetails: {
      estimatedHours: 2,
      professionalsCount: 3,
      description: "Smoke booking",
    },
    pricingSnapshot: {
      amount: 180,
      currency: "RON",
      estimatedHours: 2,
      professionalsCount: 3,
      ratePerHourPerProfessional: 90,
    },
    paymentSummary: {
      status: "unpaid",
      processor: "demo",
      amount: 180,
      currency: "RON",
      estimatedHours: 2,
      professionalsCount: 3,
      ratePerHourPerProfessional: 90,
    },
    userSnapshot: {
      displayName: "Client Base",
    },
    providerSnapshot: {
      displayName: "Provider Base",
    },
    serviceSnapshot: {
      name: "Curatenie generala",
    },
    updatedAt: "2026-10-25T09:00:00.000Z",
    ...overrides,
  };
}

test.describe("admin bookings browser smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("admin@ai-nevoie.ro").fill(BOOKING_SMOKE_ACCOUNTS.admin.email);
    await page.getByPlaceholder("••••••••").fill(BOOKING_SMOKE_ACCOUNTS.admin.password);
    await page.getByRole("button", { name: "Autentificare" }).click();
    await page.waitForURL("**/admin");
  });

  test("booking list filters and keeps the current pricing formula", async ({ page }) => {
    const requestedItem = buildListItem({
      bookingId: "bk_requested_1",
      status: "requested",
      paymentSummary: {
        status: "unpaid",
        processor: "manual_mvp",
        amount: 180,
        currency: "RON",
        estimatedHours: 2,
        professionalsCount: 2,
        ratePerHourPerProfessional: 90,
      },
      userSnapshot: { displayName: "Client Pending" },
      providerSnapshot: { displayName: "Casa in Ordine" },
    });
    const confirmedPaidItem = buildListItem({
      bookingId: "bk_paid_1",
      status: "confirmed",
      paymentSummary: {
        status: "paid",
        processor: "demo",
        amount: 180,
        currency: "RON",
        estimatedHours: 2,
        professionalsCount: 4,
        ratePerHourPerProfessional: 90,
      },
      userSnapshot: { displayName: "Client One" },
      providerSnapshot: { displayName: "Casa in Ordine" },
    });
    const seenQueries: string[] = [];

    await page.route("**/api/admin/bookings?**", async (route) => {
      const url = new URL(route.request().url());
      seenQueries.push(url.search);
      const q = url.searchParams.get("q") || "";
      const status = url.searchParams.get("status") || "all";
      const paymentStatus = url.searchParams.get("paymentStatus") || "all";

      const items = q === "Client One" && status === "confirmed" && paymentStatus === "paid"
        ? [confirmedPaidItem]
        : [requestedItem, confirmedPaidItem];

      await route.fulfill(json({
        items,
        pagination: {
          page: 1,
          pageSize: 20,
          total: items.length,
          totalPages: 1,
        },
      }));
    });

    await page.goto("/admin/programari");

    await expect(page.getByText("bk_requested_1")).toBeVisible();
    await expect(page.getByText("bk_paid_1")).toBeVisible();

    await page.getByPlaceholder("Căutare").fill("Client One");
    await page.locator("select").nth(0).selectOption("confirmed");
    await page.locator("select").nth(1).selectOption("paid");

    await expect(page.getByText("bk_paid_1")).toBeVisible();
    await expect(page.getByText("bk_requested_1")).toHaveCount(0);
    await expect(page.getByText("2h × 90 RON")).toBeVisible();
    await expect(page.getByText("2h × 90 × 4 pers")).toHaveCount(0);

    expect(seenQueries.some((queryString) => (
      queryString.includes("q=Client+One")
      && queryString.includes("status=confirmed")
      && queryString.includes("paymentStatus=paid")
    ))).toBe(true);
  });

  test("admin cancel updates booking detail after PATCH and refreshes audit", async ({ page }) => {
    let cancelled = false;
    let receivedPatch: Record<string, unknown> | null = null;

    await page.route("**/api/admin/bookings/bk_1/admin-case", async (route) => {
      receivedPatch = route.request().postDataJSON() as Record<string, unknown>;
      cancelled = true;
      await route.fulfill(json({
        bookingId: "bk_1",
        status: "cancelled_by_admin",
        resolutionStatus: "resolved",
        linkedTicketIds: [],
        reason: "ops_cancel",
        note: "User requested manual stop",
      }));
    });

    await page.route("**/api/admin/bookings/bk_1", async (route) => {
      await route.fulfill(json(cancelled
        ? {
            booking: buildListItem({
              bookingId: "bk_1",
              status: "cancelled_by_admin",
              paymentSummary: {
                paymentId: "pay_bk_1",
                status: "failed",
                amount: 180,
                currency: "RON",
                processor: "demo",
                method: "demo",
              },
              requestResponse: {
                status: "answered",
                deadlineAt: "2026-10-24T10:00:00.000Z",
                answeredAt: "2026-10-24T09:30:00.000Z",
              },
            }),
            payment: {
              paymentId: "pay_bk_1",
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
            recentAuditEvents: [
              {
                eventId: "audit_cancel_1",
                createdAt: "2026-10-24T09:31:00.000Z",
                action: "booking.cancel_by_admin",
                actorUid: "admin_1",
                actorRole: "admin",
                resourceType: "booking",
                resourceId: "bk_1",
                result: "success",
                statusFrom: "confirmed",
                statusTo: "cancelled_by_admin",
              },
            ],
          }
        : {
            booking: buildListItem({
              bookingId: "bk_1",
              status: "confirmed",
              paymentSummary: {
                paymentId: "pay_bk_1",
                status: "unpaid",
                amount: 180,
                currency: "RON",
                processor: "manual_mvp",
              },
              requestResponse: {
                status: "answered",
                deadlineAt: "2026-10-24T10:00:00.000Z",
                answeredAt: "2026-10-24T09:00:00.000Z",
              },
            }),
            payment: {
              paymentId: "pay_bk_1",
              status: "unpaid",
              amount: 180,
              currency: "RON",
              processor: "manual_mvp",
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
            recentAuditEvents: [
              {
                eventId: "audit_confirm_1",
                createdAt: "2026-10-24T09:00:00.000Z",
                action: "booking.confirm",
                actorUid: "provider_1",
                actorRole: "provider",
                resourceType: "booking",
                resourceId: "bk_1",
                result: "success",
                statusFrom: "requested",
                statusTo: "confirmed",
              },
            ],
          }));
    });

    await page.goto("/admin/programari/bk_1");

    await expect(page.getByText("Cod intern: bk_1")).toBeVisible();
    await expect(page.getByText("confirmed").first()).toBeVisible();

    await page.getByPlaceholder("Motiv (obligatoriu la admin cancel)").fill("ops_cancel");
    await page.getByPlaceholder("Notă internă").fill("User requested manual stop");

    await Promise.all([
      page.waitForResponse((response) => (
        response.url().includes("/api/admin/bookings/bk_1/admin-case")
        && response.request().method() === "PATCH"
      )),
      page.getByRole("button", { name: "Admin cancel booking" }).click(),
    ]);

    await page.waitForResponse((response) => (
      cancelled
      && response.url().includes("/api/admin/bookings/bk_1")
      && response.request().method() === "GET"
    ));

    await expect(page.getByText("cancelled by admin").first()).toBeVisible();
    await expect(page.getByText("booking.cancel_by_admin")).toBeVisible();

    expect(receivedPatch).toMatchObject({
      action: "cancel",
      reason: "ops_cancel",
      note: "User requested manual stop",
      resolutionStatus: "open",
      linkedTicketIds: [],
    });
  });
});
