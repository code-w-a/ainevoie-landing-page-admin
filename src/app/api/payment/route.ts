import { NextResponse } from "next/server";
import Stripe from "stripe";
import { captureServerException } from "@/lib/sentryServer";

type PaymentRequestBody = {
  priceId?: unknown;
};

function jsonError(code: string, status: number) {
  return NextResponse.json({ error: code, code }, { status });
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as PaymentRequestBody;
    const priceId = typeof data.priceId === "string" ? data.priceId.trim() : "";

    if (!priceId) {
      return jsonError("PAYMENT_PRICE_ID_REQUIRED", 400);
    }

    if (!priceId.startsWith("price_")) {
      return jsonError("PAYMENT_PRICE_ID_INVALID", 400);
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL;

    if (!stripeSecretKey || !siteUrl) {
      return jsonError("PAYMENT_CONFIG_MISSING", 500);
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: siteUrl,
      cancel_url: siteUrl,
    });

    return NextResponse.json(session.url);
  } catch (error) {
    captureServerException(error, { route: "api/payment/route.ts" });
    return jsonError("PAYMENT_SESSION_FAILED", 500);
  }
}
