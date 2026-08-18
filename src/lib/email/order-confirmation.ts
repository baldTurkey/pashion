import { getResend } from "@/lib/email/resend";

interface OrderConfirmationItem {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export async function sendOrderConfirmationEmail(
  toEmail: string,
  orderId: string,
  items: OrderConfirmationItem[]
) {
  const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  const itemsHtml = items
    .map(
      (item) =>
        `<tr><td>${item.name} × ${item.quantity}</td><td style="text-align:right">$${(
          (item.unitPriceCents * item.quantity) /
          100
        ).toFixed(2)}</td></tr>`
    )
    .join("");

  await getResend().emails.send({
    from: "Pashion <orders@pashion.dev>", // update once a real domain is verified in Resend
    to: toEmail,
    subject: `Order confirmed — #${orderId.slice(0, 8)}`,
    html: `
      <h1>Thanks for your order!</h1>
      <table width="100%">${itemsHtml}</table>
      <p><strong>Total: $${(totalCents / 100).toFixed(2)}</strong></p>
    `,
  });
}
