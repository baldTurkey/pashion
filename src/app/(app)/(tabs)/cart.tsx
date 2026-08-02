"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  imageUrl: string;
  currentPrice: number;
  deliveryPrice: number;
  deliveryInDays: number;
  quantity: number;
  sellerId: string | null;
};

type Address = {
  full_name: string | null;
  location: string | null;
};

const CART_KEY = "pashion_cart";

function deliveryDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString();
}

export default function Cart() {
  const supabase = createClient();
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [addressData, setAddressData] = useState<Address | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    setItems(parsed);
  }, []);

  useEffect(() => {
    const getUserAddress = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setAddressData(null);
        return;
      }

      setUserId(user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Address fetch error:", error.message);
        setAddressData(null);
      } else {
        setAddressData((data ?? null) as Address | null);
      }
    };

    getUserAddress();
  }, [supabase]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.currentPrice * item.quantity, 0),
    [items]
  );

  const checkout = async () => {
    if (!userId) {
      router.push("/sign-up");
      return;
    }

    if (!items.length) return;

    setLoadingCheckout(true);
    const formattedOrders = items.map((item) => ({
      product_name: item.name,
      delivery_address: `${addressData?.full_name ?? ""} ${addressData?.location ?? ""}`.trim(),
      image: item.imageUrl,
      buyer_id: userId,
      current_price: item.currentPrice,
      delivery_date: deliveryDate(Number(item.deliveryInDays || 3)),
      delivery_price: item.deliveryPrice,
      seller_id: item.sellerId,
      quantity: item.quantity,
      total: Number(item.deliveryPrice) * Number(item.quantity),
    }));

    const { error } = await supabase.from("orders").insert(formattedOrders);
    setLoadingCheckout(false);

    if (error) {
      console.error("Checkout error:", error.message);
      return;
    }

    localStorage.removeItem(CART_KEY);
    setItems([]);
    router.push("/thanks_buying");
  };

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Cart</h1>
        <p className="mt-3 max-w-3xl text-slate-600">Desktop-friendly checkout view with saved cart items and order submission.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {items.length === 0 ? (
          <div className="space-y-4">
            <p className="text-lg text-slate-700">Your cart is empty.</p>
            <Link href="/home" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-2xl font-semibold text-slate-900">Subtotal: {subtotal}</p>
              <button
                onClick={checkout}
                disabled={loadingCheckout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loadingCheckout ? "Processing..." : `Proceed to checkout (${items.length})`}
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.id} className="grid grid-cols-[130px_1fr] gap-4 rounded-xl border border-slate-200 p-4">
                  <div className="h-24 w-32 overflow-hidden rounded bg-slate-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-700">Quantity: {item.quantity}</p>
                    <p className="text-sm text-slate-700">Price: {item.currentPrice}</p>
                    <p className="text-sm text-slate-700">Delivery: {item.deliveryPrice}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
