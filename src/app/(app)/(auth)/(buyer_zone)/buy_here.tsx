"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Address = {
  full_name: string | null;
  location: string | null;
};

function deliveryDate(days: number): string {
  const base = new Date();
  base.setDate(base.getDate() + days);
  return base.toLocaleDateString();
}

export default function BuyHere() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [address, setAddress] = useState<Address | null>(null);

  const name = searchParams.get("name") ?? "Product";
  const quantity = Number(searchParams.get("quantity") ?? "1");
  const deliveryInDays = Number(searchParams.get("deliveryInDays") ?? "3");
  const productImage = searchParams.get("productImage") ?? "";
  const deliveryCharge = Number(searchParams.get("deliveryCharge") ?? "0");
  const currentPrice = Number(searchParams.get("currentPrice") ?? "0");
  const achoice = searchParams.get("achoice") ?? "false";
  const deliveryPrice = Number(searchParams.get("deliveryPrice") ?? "0");
  const sellerId = searchParams.get("sellerId") ?? null;

  const imageUrl = productImage;
  const subtotal = useMemo(() => deliveryPrice * quantity, [deliveryPrice, quantity]);

  const getUserProduct = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserId(user.id);
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, location")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message);
      return;
    }

    setAddress(data as Address);
  };

  useEffect(() => {
    getUserProduct();
  }, []);

  const orderSaveDb = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("orders")
      .insert([
        {
          product_name: name,
          delivery_address: `${address?.full_name} ${address?.location}`,
          image: imageUrl,
          buyer_id: userId,
          current_price: currentPrice,
          delivery_date: deliveryDate(deliveryInDays),
          delivery_price: deliveryPrice,
          seller_id: sellerId,
          quantity,
          total: subtotal,
        },
      ])
      .select();

    if (!error) {
      router.push("/");
    } else {
      console.error("Order save error:", error.message);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      {address?.location ? (
        <>
          <p className="mt-2 text-lg font-medium">{`Delivering to ${address.full_name}`}</p>
          <p className="text-base text-slate-700">
            {address.location}
          </p>
          <button onClick={() => router.push("/")}>
            <span className="mt-1 inline-block text-blue-700 underline">
              Change address
            </span>
          </button>
        </>
      ) : (
        <button onClick={() => router.push("/")}>
          <span className="text-blue-700 underline">
            Add an address
          </span>
        </button>
      )}

      <div className="h-px w-full bg-slate-300" />
      <p className="text-lg font-medium">{`Arriving ${deliveryDate(deliveryInDays)}`}</p>
      <p className="text-sm text-slate-600">if you order in the next 10 hours and 48 minutes</p>

      <div className="mt-2 flex flex-row gap-4 rounded-xl bg-slate-100 p-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-32 w-28 rounded bg-white object-contain"
          />
        ) : (
          <div className="flex h-32 w-28 items-center justify-center rounded bg-white text-xs text-slate-400">
            No image
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xl font-medium">{name}</p>
          <p>{`Quantity: ${quantity}`}</p>
          <p>{`$ ${currentPrice}`}</p>
          <p>{`Delivery Charges: $ ${deliveryCharge}`}</p>
          <p>{`Sub Total: $ ${subtotal}`}</p>
          {achoice === "true" && (
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              Prime
            </span>
          )}
        </div>
      </div>

      <button
        onClick={orderSaveDb}
        className="mt-2 rounded-lg bg-slate-900 px-4 py-3 text-white hover:bg-slate-800"
      >
        Pay with cash on delivery
      </button>
    </div>
  );
}
