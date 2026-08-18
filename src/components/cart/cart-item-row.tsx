import { Shirt, Minus, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CartItem } from "@/types/cart";

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleSaved: (id: string) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove, onToggleSaved }: CartItemRowProps) {
  return (
    <Card className="flex gap-4 p-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-brand-blush">
        <Shirt className="text-brand-olive-dark" size={32} />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-serif text-lg text-brand-ink">{item.name}</p>
            <p className="text-xs uppercase tracking-wide text-brand-accent">{item.brandName}</p>
            <p className="mt-1 text-sm text-brand-ink/60">Size {item.size}</p>
          </div>
          <p className="whitespace-nowrap font-semibold text-brand-ink">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {!item.savedForLater && (
            <div className="flex items-center gap-3 rounded-full bg-brand-cream px-2 py-1">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => onQuantityChange(item.id, -1)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-ink hover:bg-white"
              >
                <Minus size={16} />
              </button>
              <span className="w-4 text-center text-sm font-medium text-brand-ink">{item.quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => onQuantityChange(item.id, 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-brand-ink hover:bg-white"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            {item.savedForLater ? (
              <button
                type="button"
                onClick={() => onToggleSaved(item.id)}
                className="font-medium text-brand-accent hover:underline"
              >
                Move to Cart
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleSaved(item.id)}
                className="text-brand-ink/60 hover:text-brand-accent hover:underline"
              >
                Save for later
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-brand-ink/60 hover:text-brand-accent hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
