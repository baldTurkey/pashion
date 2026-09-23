# PASHION
Pashion helps independent brands cultivate dedicated communities and launch their next releases with maximum momentum

## Production Stripe setup

For Vercel Production, add these environment variables using values from Stripe's **live mode**:

- `STRIPE_SECRET_KEY`: the live secret key beginning with `sk_live_`
- `STRIPE_WEBHOOK_SECRET`: the signing secret from a live webhook endpoint

Create a Stripe webhook for `https://<your-vercel-domain>/api/webhooks/stripe` and enable:

- `checkout.session.completed`
- `account.updated`

Use the live Connect settings for the same Stripe platform account. Checkout payments, connected brand accounts, transfers, and webhook verification all use `STRIPE_SECRET_KEY`. The server rejects a test secret when `NODE_ENV` or `VERCEL_ENV` is `production`.
