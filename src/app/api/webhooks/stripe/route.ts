import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  decrementProductStock,
  getOrderByStripeSessionId,
  getOrderItems,
  markOrderPaidIfPending,
  recordItemTransfer,
} from "@/lib/orders/queries";
import { sendOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { sendBrandOrderNotificationEmail } from "@/lib/email/brand-order-notification";

// Stripe calls this directly (not the browser), so it's the one place we can
// trust that money actually moved. Two events handled:
//  - checkout.session.completed: mark the order paid, decrement inventory,
//    clear the cart, send the confirmation email, and pay out each brand's
//    share.
//  - account.updated: keep brands.stripe_payouts_enabled in sync with the
//    connected account's real onboarding status.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text(); // must read raw text, not .json() — the signature is computed over the exact bytes

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
  ].filter((secret): secret is string => Boolean(secret));

  let event: Stripe.Event | null = null;
  let signatureError: unknown;
  for (const secret of webhookSecrets) {
    try {
      event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
      break;
    } catch (err) {
      signatureError = err;
    }
  }

  if (!event) {
    return NextResponse.json(
      { error: `Invalid signature: ${signatureError instanceof Error ? signatureError.message : "unknown error"}` },
      { status: 400 }
    );
  }

  const adminClient = getAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const order = await getOrderByStripeSessionId(adminClient, session.id);

    if (!order) {
      // Nothing we can do with an order we don't recognize — ack anyway so
      // Stripe stops retrying.
      return NextResponse.json({ received: true });
    }

    // Fulfillment: happens exactly once, gated on the pending -> paid flip.
    const isFirstTime = await markOrderPaidIfPending(adminClient, order.id);

    if (isFirstTime) {
      const items = await getOrderItems(adminClient, order.id);

      // Atomic per-product decrement (no-ops for untracked/NULL stock). Best
      // effort here — the payment already succeeded, so a failed decrement
      // logs rather than blocks; real oversell prevention happens earlier,
      // at /api/checkout, before Stripe is ever involved.
      await Promise.all(
        items.map((item) =>
          decrementProductStock(adminClient, item.product_id, item.quantity).catch((err) =>
            console.error(`Failed to decrement stock for product ${item.product_id}:`, err)
          )
        )
      );

      // Cart is now an order — clear it.
      await adminClient.from("cart_items").delete().eq("customer_id", order.customer_id);

      // Confirmation email — sent from here (not the success page) because
      // this webhook is the only step guaranteed to run once payment is
      // real. Deliberately not gated on payouts below succeeding: the
      // customer's purchase is real regardless of how brand transfers go.
      const { data: userLookup } = await adminClient.auth.admin.getUserById(order.customer_id);
      if (userLookup.user?.email) {
        await sendOrderConfirmationEmail(
          userLookup.user.email,
          order.id,
          items.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            unitPriceCents: item.unit_price_cents,
          })),
          order.shipping_cents
        );
      }

      const itemsByBrand = new Map<string, typeof items>();
      for (const item of items) {
        const brandItems = itemsByBrand.get(item.brand_id) ?? [];
        brandItems.push(item);
        itemsByBrand.set(item.brand_id, brandItems);
      }

      const brandIdsForEmail = [...itemsByBrand.keys()];
      const { data: emailBrands, error: emailBrandsError } = await adminClient
        .from("brands")
        .select("brand_uuid, account_id, company_name, contact_info")
        .in("brand_uuid", brandIdsForEmail);

      if (emailBrandsError) {
        console.error(`Failed to load brand email recipients for order ${order.id}:`, emailBrandsError);
      } else {
        await Promise.all(
          (emailBrands ?? []).map(async (brand) => {
            const brandItems = itemsByBrand.get(brand.brand_uuid) ?? [];
            let contactInfo: { email?: string } | null = null;

            try {
              contactInfo = typeof brand.contact_info === "string"
                ? JSON.parse(brand.contact_info)
                : brand.contact_info;
            } catch {
              console.warn(`Invalid contact info for brand ${brand.brand_uuid}`);
            }

            let recipient = contactInfo?.email?.trim();
            if (!recipient) {
              const { data: owner } = await adminClient.auth.admin.getUserById(brand.account_id);
              recipient = owner.user?.email ?? undefined;
            }

            if (!recipient) {
              console.error(`No email address available for brand ${brand.brand_uuid} on order ${order.id}`);
              return;
            }

            const brandShippingCents = brandItems.reduce((sum, item) => sum + item.shipping_cents, 0);
            try {
              await sendBrandOrderNotificationEmail(
                recipient,
                brand.company_name,
                order.id,
                brandItems.map((item) => ({
                  name: item.product_name,
                  quantity: item.quantity,
                  unitPriceCents: item.unit_price_cents,
                })),
                brandShippingCents,
                {
                  name: order.shipping_name,
                  address: order.shipping_address,
                  city: order.shipping_city,
                  region: order.shipping_region,
                  postalCode: order.shipping_postal_code,
                  country: order.shipping_country,
                }
              );
            } catch (err) {
              console.error(`Failed to notify brand ${brand.brand_uuid} for order ${order.id}:`, err);
            }
          })
        );
      }
    }

    // Payouts: deliberately outside the isFirstTime gate above. A retried
    // delivery of this same event (Stripe retries on a non-2xx) must be able
    // to pick up any transfer that failed last time — isFirstTime would be
    // false on a retry and skip this entirely if it lived inside that block.
    // Idempotency here comes from only acting on items still missing a
    // stripe_transfer_id, not from "first delivery of this webhook".
    const items = await getOrderItems(adminClient, order.id);
    const untransferred = items.filter((item) => !item.stripe_transfer_id);

    if (untransferred.length > 0) {
      const totalsByBrand = new Map<string, number>();
      for (const item of untransferred) {
        totalsByBrand.set(
          item.brand_id,
          (totalsByBrand.get(item.brand_id) ?? 0) +
            item.unit_price_cents * item.quantity +
            item.shipping_cents
        );
      }

      // order_items.brand_id stores brands.brand_uuid (matching
      // products.brand_id), not account_id — account_id is only needed here
      // to know whether payouts are connected; brand_uuid is what ties the
      // transfer back to the right order_items.
      const brandIds = [...totalsByBrand.keys()];
      const { data: brands, error: brandsError } = await adminClient
        .from("brands")
        .select("brand_uuid, stripe_account_id")
        .in("brand_uuid", brandIds);

      if (brandsError) {
        console.error(`Failed to load payout destinations for order ${order.id}:`, brandsError);
        return NextResponse.json({ error: "Failed to load payout destinations" }, { status: 500 });
      }

      const brandsById = new Map((brands ?? []).map((brand) => [brand.brand_uuid, brand]));
      let anyTransferFailed = false;

      for (const [brandId, amount] of totalsByBrand) {
        const brand = brandsById.get(brandId);
        if (!brand?.stripe_account_id) {
          console.error(`Missing Stripe payout destination for brand ${brandId} on order ${order.id}`);
          anyTransferFailed = true;
          continue;
        }

        const brandItems = untransferred.filter((item) => item.brand_id === brandId);

        try {
          const transfer = await getStripe().transfers.create({
            amount,
            currency: "usd",
            destination: brand.stripe_account_id,
            transfer_group: order.id,
          });

          for (const item of brandItems) {
            await recordItemTransfer(adminClient, item.id, transfer.id);
          }
        } catch (err) {
          // One brand's transfer failing shouldn't block payouts to other
          // brands in the same order. Log and keep going; the 500 below
          // tells Stripe to retry this event, which will naturally pick
          // this brand back up since its items still lack a transfer_id.
          console.error(`Stripe transfer failed for order ${order.id}, brand ${brandId}:`, err);
          anyTransferFailed = true;
        }
      }

      if (anyTransferFailed) {
        return NextResponse.json({ error: "One or more brand transfers failed" }, { status: 500 });
      }
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    await adminClient
      .from("brands")
      .update({ stripe_payouts_enabled: account.payouts_enabled ?? false })
      .eq("stripe_account_id", account.id);
  }

  return NextResponse.json({ received: true });
}
