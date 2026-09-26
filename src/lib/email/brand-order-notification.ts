import { getResend } from "@/lib/email/resend";

export interface BrandOrderNotificationItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface BrandOrderShippingDetails {
  name: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendBrandOrderNotificationEmail(
  toEmail: string,
  brandName: string,
  orderId: string,
  items: BrandOrderNotificationItem[],
  shippingCents: number,
  shipping: BrandOrderShippingDetails
) {
  const subtotalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const rows = items
    .map((item) => {
      const lineTotal = ((item.unitPriceCents * item.quantity) / 100).toFixed(2);
      return `<tr><td style="padding:8px 0">${escapeHtml(item.name)} × ${item.quantity}</td><td style="padding:8px 0;text-align:right">$${lineTotal}</td></tr>`;
    })
    .join("");
  const addressLines = [
    shipping.name,
    shipping.address,
    [shipping.city, shipping.region, shipping.postalCode].filter(Boolean).join(", "),
    shipping.country,
  ]
    .filter((line): line is string => Boolean(line))
    .map(escapeHtml);
  const safeBrandName = escapeHtml(brandName);

  const { error } = await getResend().emails.send({
    from: "Pashion <orders@pashion.dev>",
    to: toEmail,
    subject: `New order — #${orderId.slice(0, 8)}`,
    html: `
      <h1>New order for ${safeBrandName}</h1>
      <p>Order #${escapeHtml(orderId.slice(0, 8))} has been paid.</p>
      <table width="100%" style="border-collapse:collapse">${rows}</table>
      <p>Items subtotal: $${(subtotalCents / 100).toFixed(2)}</p>
      <p>Shipping charged for your brand: $${(shippingCents / 100).toFixed(2)}</p>
      <h2>Ship to</h2>
      <p>${addressLines.join("<br>") || "No shipping address provided"}</p>
    `,
  });

  if (error) throw new Error(error.message);
}
