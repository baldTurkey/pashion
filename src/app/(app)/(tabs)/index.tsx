"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "./search_bar";

type Product = {
  id: string;
  product_id?: string | null;
  name: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  currentPrice?: number | null;
  current_price?: number | null;
  deliveryPrice?: number | null;
  delivery_price?: number | null;
  deliveryInDays?: number | null;
  delivery_in_days?: number | null;
  user_id?: string | null;
};

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

const CART_KEY = "pashion_cart";

export default function Home() {
  const supabase = createClient();
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState(0);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setDbError(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(Boolean(user));

      const { data, error } = await supabase.from("products").select("*").limit(24);
      if (error) {
        console.error("Product fetch error:", error.message);
        setDbError(error.message);
      }
      const rows = (data ?? []) as Record<string, unknown>[];
      setRawCount(rows.length);
      setSampleColumns(rows.length > 0 ? Object.keys(rows[0]) : []);
      setDeals(rows as Product[]);
      setLoading(false);
    };

    loadData();
  }, [supabase]);

  const products = useMemo(
    () =>
      deals.map((p, index) => {
        const normalizedId = p.id ?? p.product_id ?? `row-${index}`;
        return {
          ...p,
          id: normalizedId,
        };
      }),
    [deals]
  );

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const addToCart = (product: Product) => {
    const nextItem: CartItem = {
      id: product.id,
      name: product.name ?? "Untitled product",
      imageUrl: product.imageUrl ?? product.image_url ?? "",
      currentPrice: Number(product.currentPrice ?? product.current_price ?? 0),
      deliveryPrice: Number(product.deliveryPrice ?? product.delivery_price ?? 0),
      deliveryInDays: Number(product.deliveryInDays ?? product.delivery_in_days ?? 3),
      quantity: 1,
      sellerId: product.user_id ?? null,
    };

    try {
      const raw = localStorage.getItem(CART_KEY);
      const current = raw ? (JSON.parse(raw) as CartItem[]) : [];
      const existing = current.find((item) => item.id === nextItem.id);

      const updated = existing
        ? current.map((item) =>
            item.id === nextItem.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...current, nextItem];

      localStorage.setItem(CART_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Cart save error:", error);
    }
  };

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Home</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Browse products and add them to your cart. This layout is optimized for laptop screens and scales down on smaller devices.
        </p>
        <div className="mt-5 flex gap-3">
          {!signedIn && (
            <Link href="/sign-up" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Sign in or create account
            </Link>
          )}
          <Link href="/cart" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Open cart
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Deals for You</h2>

        <SearchBar products={products} onFilteredChange={setFilteredProducts} />
        {loading ? (
          <p className="mt-4 text-slate-500">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="mt-4 text-slate-500">No products found.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const name = product.name ?? "Untitled product";
              const imageUrl = product.imageUrl ?? product.image_url ?? "";
              const price = Number(product.currentPrice ?? product.current_price ?? 0);

              return (
                <article key={product.id} className="flex h-full flex-col rounded-2xl border border-slate-200 p-5">
                  <div className="mb-4 h-48 w-full overflow-hidden rounded-lg bg-slate-100">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
                  <p className="mt-1 text-slate-700">Rs. {price}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-4 w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Add to cart
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
