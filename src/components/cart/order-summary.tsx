import Link from "next/link";
import { Card } from "@/components/ui/card";

interface OrderSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function OrderSummary({ subtotal, itemCount }: OrderSummaryProps) {
  return (
    <Card className="p-6 lg:sticky lg:top-24">
      <h2 className="font-serif text-xl text-brand-ink">Order Summary</h2>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-brand-ink/70">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-brand-ink/70">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="flex justify-between text-brand-ink/70">
          <span>Estimated tax</span>
          <span>Calculated at checkout</span>
        </div>
      </div>

      <div className="mt-4 flex justify-between border-t border-brand-ink/10 pt-4 font-semibold text-brand-ink">
        <span>Total</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      <Link
        href="/checkout"
        className="mt-6 flex w-full items-center justify-center rounded-full bg-brand-accent px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-brand-olive-dark"
      >
        Check Out
      </Link>
    </Card>
  );
}
