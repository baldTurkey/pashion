"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  product_name: string | null;
  total: number | null;
  delivery_date: string | null;
  created_at: string;
};

export default function MyOrder() {
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setOrders([]);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Order fetch error:", error.message);
      return;
    }

    setOrders((data ?? []) as Order[]);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-semibold">
        Your Order
      </h2>

      {orders.length === 0 && <p className="text-slate-500">No orders found yet.</p>}

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-medium">{order.product_name ?? "Unnamed product"}</p>
            <p className="text-sm text-slate-600">Total: {order.total ?? 0}</p>
            <p className="text-sm text-slate-600">Delivery date: {order.delivery_date ?? "TBD"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
