import { ComingSoon } from "@/components/ui/coming-soon";

export default function CheckoutPage() {
  return (
    <ComingSoon
      title="Checkout is coming soon"
      description="We're building a smooth checkout experience. In the meantime, your cart is saved."
      backHref="/cart"
      backLabel="Back to Cart"
    />
  );
}
