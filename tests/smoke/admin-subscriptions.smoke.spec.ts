import { expect, test } from "@playwright/test";
import { BOOKING_SMOKE_ACCOUNTS } from "../../../scripts/booking-smoke-config.mjs";

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function buildSubscription(overrides: Record<string, unknown>) {
  return {
    subscriptionId: "sub_base",
    userId: "user_1",
    providerId: "provider_1",
    serviceId: "service_cleaning",
    frequency: "weekly",
    status: "active",
    timezone: "Europe/Bucharest",
    scheduledStartTime: "10:00",
    nextScheduledDateKey: "2026-06-22",
    occurrenceCount: 3,
    firstBookingId: "bk_first",
    lastBookingId: "bk_last",
    createdAt: "2026-06-01T09:00:00.000Z",
    ...overrides,
  };
}

test.describe("admin subscriptions browser smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder("admin@ai-nevoie.ro").fill(BOOKING_SMOKE_ACCOUNTS.admin.email);
    await page.getByPlaceholder("••••••••").fill(BOOKING_SMOKE_ACCOUNTS.admin.password);
    await page.getByRole("button", { name: "Autentificare" }).click();
    await page.waitForURL("**/admin");
  });

  test("lists subscriptions and pauses an active one", async ({ page }) => {
    let paused = false;
    let receivedStatus: string | null = null;

    await page.route("**/api/admin/subscriptions?**", async (route) => {
      const activeItem = buildSubscription({ subscriptionId: "sub_active_1", status: paused ? "paused" : "active" });
      const cancelledItem = buildSubscription({
        subscriptionId: "sub_cancelled_1",
        status: "cancelled",
        frequency: "monthly",
        userId: "user_2",
        providerId: "provider_2",
      });

      await route.fulfill(json({
        items: [activeItem, cancelledItem],
        pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
      }));
    });

    await page.route("**/api/admin/subscriptions/sub_active_1/status", async (route) => {
      receivedStatus = (route.request().postDataJSON() as Record<string, unknown>)?.status as string;
      paused = true;
      await route.fulfill(json({
        subscription: buildSubscription({ subscriptionId: "sub_active_1", status: "paused" }),
        status: "ok",
      }));
    });

    await page.goto("/admin/abonamente");

    await expect(page.getByText("sub_active_1")).toBeVisible();
    await expect(page.getByText("sub_cancelled_1")).toBeVisible();
    await expect(page.getByText("Săptămânal")).toBeVisible();

    await Promise.all([
      page.waitForResponse((response) => (
        response.url().includes("/api/admin/subscriptions/sub_active_1/status")
        && response.request().method() === "POST"
      )),
      page.getByRole("button", { name: "Pauză" }).click(),
    ]);

    expect(receivedStatus).toBe("paused");
    await expect(page.getByRole("button", { name: "Reactivează" })).toBeVisible();
  });
});
