"use client";

import { useState } from "react";
import Link from "next/link";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { OrderSummary } from "@/components/cart/order-summary";
import { EmptyCart } from "@/components/cart/empty-cart";
import type { CartItem } from "@/types/cart";

const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: "1",
    name: "Oversized Wool Coat",
    brandName: "Marlowe & Ash",
    size: "M",
    price: 248,
    quantity: 1,
    savedForLater: false,
  },
  {
    id: "2",
    name: "Pleated Midi Skirt",
    brandName: "Solene Studio",
    size: "S",
    price: 89,
    quantity: 2,
    savedForLater: false,
  },
  {
    id: "3",
    name: "Silk Slip Dress",
    brandName: "Marlowe & Ash",
    size: "M",
    price: 165,
    quantity: 1,
    savedForLater: false,
  },
  {
    id: "4",
    name: "Classic Leather Loafers",
    brandName: "Etta Row",
    size: "US 8",
    price: 210,
    quantity: 1,
    savedForLater: true,
  },
];

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(MOCK_CART_ITEMS);

  const activeItems = items.filter((item) => !item.savedForLater);
  const savedItems = items.filter((item) => item.savedForLater);

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSaved = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, savedForLater: !item.savedForLater } : item))
    );
  };

  if (activeItems.length === 0 && savedItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 pb-28 lg:pb-16">
      <h1 className="font-serif text-3xl text-brand-ink">Your Bag</h1>
      <p className="mt-2 text-brand-ink/70">
        {activeItems.length} {activeItems.length === 1 ? "item" : "items"} ready for checkout
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {activeItems.length === 0 ? (
            <p className="text-brand-ink/60">Your bag is empty, but you have items saved for later below.</p>
          ) : (
            activeItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
                onToggleSaved={toggleSaved}
              />
            ))
          )}

          {savedItems.length > 0 && (
            <div className="mt-6">
              <h2 className="font-serif text-xl text-brand-ink">Saved for Later</h2>
              <div className="mt-4 flex flex-col gap-4">
                {savedItems.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onQuantityChange={updateQuantity}
                    onRemove={removeItem}
                    onToggleSaved={toggleSaved}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <OrderSummary subtotal={subtotal} itemCount={itemCount} />
        </div>
      </div>

      {activeItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-brand-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-brand-ink/60">Total</p>
              <p className="text-lg font-semibold text-brand-ink">${subtotal.toFixed(2)}</p>
            </div>
            <Link
              href="/checkout"
              className="inline-flex items-center justify-center rounded-full bg-brand-accent px-6 py-2.5 text-base font-medium text-white hover:bg-brand-olive-dark"
            >
              Check Out
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
