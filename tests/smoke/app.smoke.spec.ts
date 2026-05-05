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

  test("provider onboarding location step supports county and city selection", async ({ page }) => {
    await expectPageLoads(page, "/ro/providers/onboarding/form");

    await page.locator('input[name="fullName"]').fill("Provider Smoke Test");
    await page.locator('input[name="email"]').fill("provider-smoke@example.com");
    await page.locator("#provider-password").fill("Passw0rd!");
    await page.locator("#provider-confirm-password").fill("Passw0rd!");
    await page.locator("#provider-phone-input").fill("+40701234567");
    await page.getByRole("button", { name: /Continuă la pasul următor|Continue/ }).click();

    await expect(page.locator("#provider-county")).toBeVisible();
    await page.locator("#provider-county").selectOption("B");
    await page.locator("#provider-city").click();
    await expect(page.locator("#provider-city-search")).toBeEnabled();
    await page.locator("#provider-city-search").fill("sector 6");
    await page.locator("#provider-city-listbox").getByRole("option", { name: "Sector 6" }).click();

    await expect(page.locator("#provider-city")).toContainText("Sector 6");
    await page.getByRole("button", { name: /Continuă la pasul următor|Continue/ }).click();

    const nextButton = page.getByRole("button", { name: /Continuă la pasul următor|Continue/ });
    await expect(nextButton).toBeDisabled();
    await page.locator('input[name="acceptTerms"]').check({ force: true });
    await expect(nextButton).toBeEnabled();
  });

  test("footer newsletter signup requires terms checkbox before submit", async ({ page }) => {
    await expectPageLoads(page, "/ro");

    const newsletterForm = page.locator("form").filter({
      has: page.locator('input[name="footerEmail"]'),
    });
    await newsletterForm.locator('input[name="footerEmail"]').scrollIntoViewIfNeeded();
    const submitButton = newsletterForm.locator('button[type="submit"]');

    await expect(submitButton).toBeDisabled();
    await newsletterForm.locator('input[name="footerEmail"]').fill("smoke@example.com");
    await expect(submitButton).toBeDisabled();
    await newsletterForm.locator('input[name="footerAcceptTerms"]').check({ force: true });
    await expect(submitButton).toBeEnabled();
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
