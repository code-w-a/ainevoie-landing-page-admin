import { expect, test, type Page } from "@playwright/test";

async function expectPageLoads(page: Page, path: string) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const response = await page.goto(path, { waitUntil: "domcontentloaded" });

  expect(response, `${path} should return an HTTP response`).not.toBeNull();
  expect(response?.status(), `${path} should not return 5xx`).toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toBeEmpty();
  expect(pageErrors).toEqual([]);
}

test.describe("application smoke checks", () => {
  test("Romanian homepage loads", async ({ page }) => {
    await expectPageLoads(page, "/ro");
  });

  test("English homepage loads", async ({ page }) => {
    await expectPageLoads(page, "/en");
  });

  test("legal pages load", async ({ page }) => {
    for (const path of ["/ro/privacy", "/ro/terms", "/ro/cookies", "/ro/gdpr"]) {
      await expectPageLoads(page, path);
    }
  });

  test("provider onboarding pages load", async ({ page }) => {
    for (const path of ["/ro/providers/onboarding", "/ro/providers/onboarding/form"]) {
      await expectPageLoads(page, path);
    }
  });

  test("auth and admin entry points load", async ({ page }) => {
    for (const path of ["/ro/auth/signin", "/ro/auth/signup", "/admin/login"]) {
      await expectPageLoads(page, path);
    }
  });

  test("public API guardrails return controlled errors", async ({ request }) => {
    const newsletter = await request.post("/api/newsletter", {
      data: { email: "invalid-email" },
    });
    expect(newsletter.status()).toBe(400);
    await expect(newsletter.json()).resolves.toMatchObject({
      code: "NEWSLETTER_INVALID_EMAIL",
    });

    const payment = await request.post("/api/payment", {
      data: {},
    });
    expect(payment.status()).toBe(400);
    await expect(payment.json()).resolves.toMatchObject({
      code: "PAYMENT_PRICE_ID_REQUIRED",
    });

    const rootApi = await request.get("/api");
    expect(rootApi.status()).toBe(501);
    await expect(rootApi.json()).resolves.toMatchObject({
      error: "Endpoint indisponibil.",
    });
  });
});
