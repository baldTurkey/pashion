# PASHION
Pashion helps independent brands cultivate dedicated communities and launch their next releases with maximum momentum

## Production Stripe setup

For Vercel Production, add these environment variables using values from Stripe's **live mode**:

- `STRIPE_SECRET_KEY`: the live secret key beginning with `sk_live_`
- `STRIPE_WEBHOOK_SECRET`: the signing secret from a live platform webhook endpoint
- `STRIPE_CONNECT_WEBHOOK_SECRET`: the signing secret from a live Connect webhook endpoint

Create two live Stripe webhook endpoints, both pointing to `https://<your-vercel-domain>/api/webhooks/stripe`:

- A platform-scoped endpoint for `checkout.session.completed`; put its signing secret in `STRIPE_WEBHOOK_SECRET`.
- A connected-accounts-scoped Connect endpoint for `account.updated`; put its signing secret in `STRIPE_CONNECT_WEBHOOK_SECRET`.

Use the live Connect settings for the same Stripe platform account. Checkout payments, connected brand accounts, transfers, and webhook verification all use `STRIPE_SECRET_KEY`. The server rejects a test secret when `NODE_ENV` or `VERCEL_ENV` is `production`.

## Shipping setup

Set `MAPBOX_ACCESS_TOKEN` on the server and `NEXT_PUBLIC_MAPBOX_TOKEN` in the browser. The browser token powers address suggestions; the server token verifies checkout destinations before pricing.

Shipping is calculated once per brand shipment with the open-source `@turf/distance` geodesic calculator. The current rate is $5.99 plus $0.08/km, capped at $39.99 per brand. The charge is stored on the order, included in Stripe Checkout, and transferred to the fulfilling brand. Apply the Supabase migration `20260924120000_shipping_costs.sql` before deploying this version.
