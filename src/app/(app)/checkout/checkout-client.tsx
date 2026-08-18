"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import type { CartItem } from "@/types/cart";

interface ShippingForm {
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
}

export function CheckoutClient({ items, subtotal }: { items: CartItem[]; subtotal: number }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingForm>();

  const onSubmit = async (data: ShippingForm) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Something went wrong");
        return;
      }

      window.location.href = result.url; // off to Stripe's hosted payment page
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl text-brand-ink">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-serif text-xl text-brand-ink">Shipping details</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm text-brand-ink/70">Full name</label>
              <input
                {...register("shippingName", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingName && <p className="mt-1 text-xs text-red-600">{errors.shippingName.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm text-brand-ink/70">Address</label>
              <input
                {...register("shippingAddress", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingAddress && (
                <p className="mt-1 text-xs text-red-600">{errors.shippingAddress.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-brand-ink/70">City</label>
              <input
                {...register("shippingCity", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingCity && <p className="mt-1 text-xs text-red-600">{errors.shippingCity.message}</p>}
            </div>

            <div>
              <label className="text-sm text-brand-ink/70">State / Region</label>
              <input
                {...register("shippingRegion", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingRegion && (
                <p className="mt-1 text-xs text-red-600">{errors.shippingRegion.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-brand-ink/70">Postal code</label>
              <input
                {...register("shippingPostalCode", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingPostalCode && (
                <p className="mt-1 text-xs text-red-600">{errors.shippingPostalCode.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-brand-ink/70">Country</label>
              <input
                {...register("shippingCountry", { required: "Required" })}
                className="mt-1 w-full rounded-lg border border-brand-ink/15 px-3 py-2"
              />
              {errors.shippingCountry && (
                <p className="mt-1 text-xs text-red-600">{errors.shippingCountry.message}</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-accent px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-brand-olive-dark disabled:opacity-60 sm:col-span-2"
            >
              {submitting ? "Redirecting to Stripe…" : `Pay $${subtotal.toFixed(2)} with Stripe`}
            </button>
          </form>
        </Card>

        <Card className="p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl text-brand-ink">Order review</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="text-brand-ink">{item.name}</p>
                  <p className="text-brand-ink/60">
                    {item.brandName} · Qty {item.quantity}
                  </p>
                </div>
                <p className="whitespace-nowrap text-brand-ink">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-brand-ink/10 pt-4 font-semibold text-brand-ink">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
