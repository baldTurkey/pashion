import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY. Add it to .env.local and restart the Next.js server.");
    }

    const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
    if (isProduction && !secretKey.startsWith("sk_live_")) {
      throw new Error("Production Stripe configuration requires a live-mode STRIPE_SECRET_KEY (sk_live_...).");
    }

    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return stripeClient;
}
