import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  createSession: vi.fn(),
}));

vi.mock("stripe", () => {
  const StripeMock = vi.fn(function Stripe() {
    return {
      checkout: {
        sessions: {
          create: mocks.createSession,
        },
      },
    };
  });

  return {
    default: StripeMock,
  };
});

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { POST } from "../route";

const originalEnv = process.env;

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/payment", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

describe("POST /api/payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SITE_URL: "https://ainevoie.example",
      STRIPE_SECRET_KEY: "sk_test_123",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 400 when priceId is missing", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "PAYMENT_PRICE_ID_REQUIRED",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns 400 when priceId is not a Stripe Price id", async () => {
    const response = await POST(request({ priceId: "prod_123" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "PAYMENT_PRICE_ID_INVALID",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns 500 when Stripe configuration is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const response = await POST(request({ priceId: "price_123" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      code: "PAYMENT_CONFIG_MISSING",
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates a subscription Checkout Session and returns its URL", async () => {
    mocks.createSession.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/c/session-id",
    });

    const response = await POST(request({ priceId: " price_123 " }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBe(
      "https://checkout.stripe.com/c/session-id",
    );
    expect(mocks.createSession).toHaveBeenCalledWith({
      cancel_url: "https://ainevoie.example",
      line_items: [
        {
          price: "price_123",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "https://ainevoie.example",
    });
  });

  it("returns 500 and captures Stripe errors", async () => {
    mocks.createSession.mockRejectedValueOnce(new Error("stripe down"));

    const response = await POST(request({ priceId: "price_123" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      code: "PAYMENT_SESSION_FAILED",
    });
    expect(mocks.captureServerException).toHaveBeenCalledWith(
      expect.any(Error),
      { route: "api/payment/route.ts" },
    );
  });
});
