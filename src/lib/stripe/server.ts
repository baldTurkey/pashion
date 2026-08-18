import Stripe from "stripe";

// Lazy singleton: constructing Stripe() with a missing/empty key throws
// immediately, and Next.js executes route modules at build time to collect
// metadata — so building this eagerly at import time breaks the build
// whenever STRIPE_SECRET_KEY isn't set yet (or isn't available at build
// time on a host like Vercel). Building it on first real use avoids that.
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return stripeClient;
}
