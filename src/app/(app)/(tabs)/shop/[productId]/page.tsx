import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type Product = {
  id: string;
  product_id?: string | null;
  name?: string | null;
  description?: string | null;
  created_at?: string | null;
  size?: string | null;
  style?: string | null;
  care_info?: string | null;
  size_guide?: string | null;
  sizeGuide?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  currentPrice?: number | null;
  current_price?: number | null;
  deliveryPrice?: number | null;
  delivery_price?: number | null;
  deliveryInDays?: number | null;
  delivery_in_days?: number | null;
};

type ProductPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

async function getProductByRouteId(routeId: string): Promise<Product | null> {
  const supabase = await createSupabaseServer();

  const byProductId = await supabase
    .from("products")
    .select("*")
    .eq("product_id", routeId)
    .maybeSingle();

  if (byProductId.data) {
    return byProductId.data as Product;
  }

  const byId = await supabase.from("products").select("*").eq("id", routeId).maybeSingle();
  if (byId.data) {
    return byId.data as Product;
  }

  return null;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const routeId = decodeURIComponent(resolvedParams.productId);
  const product = await getProductByRouteId(routeId);

  if (!product) {
    return (
      <main className="space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Product not found</h1>
          <p className="mt-3 text-slate-600">
            This product page is unique to an item id, but no product matched: {routeId}
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/home"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Back to home
            </Link>
            <Link
              href="/shop"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Shop overview
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const name = product.name ?? "Untitled product";
  const imageUrl = product.imageUrl ?? product.image_url ?? "";
  const price = Number(product.currentPrice ?? product.current_price ?? 0);
  const postedDate = product.created_at ? new Date(product.created_at) : null;
  const postedOn =
    postedDate && !Number.isNaN(postedDate.getTime())
      ? new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(postedDate)
      : "Unknown";
  const size = product.size ?? "Not provided";
  const style = product.style ?? "Not provided";
  const careInfo = product.care_info ?? "Not provided";
  const description = product.description ?? "No description provided.";
  const sizeGuide = product.size_guide ?? product.sizeGuide ?? null;
  const isSizeGuideUrl = Boolean(sizeGuide && /^https?:\/\//i.test(sizeGuide));
  const sizeOptions = size
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);

  return (
    <main className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:col-span-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{name}</h1>
        <p className="mt-3 text-sm text-slate-500">Unique product route id: {routeId}</p>

        <div className="mt-6 space-y-8">
          <div className="h-96 w-full overflow-hidden rounded-xl bg-slate-100">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="space-y-5">
            <p className="text-sm text-slate-500">Listed on {postedOn}</p>

            <div className="grid gap-3 text-slate-700">
              <p>
                <span className="font-medium text-slate-900">Description:</span> {description}
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">Size</p>
                  {sizeGuide &&
                    (isSizeGuideUrl ? (
                      <a
                        href={sizeGuide}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Size guide
                      </a>
                    ) : (
                      <details>
                        <summary className="cursor-pointer list-none rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
                          Size guide
                        </summary>
                        <p className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-700">
                          {sizeGuide}
                        </p>
                      </details>
                    ))}
                </div>

                {sizeOptions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sizeOptions.map((sizeOption, index) => {
                      const inputId = `size-${index}`;
                      return (
                        <div key={inputId}>
                          <input
                            id={inputId}
                            type="radio"
                            name="selected-size"
                            value={sizeOption}
                            defaultChecked={index === 0}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={inputId}
                            className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700"
                          >
                            {sizeOption}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-600">Not provided</p>
                )}
              </div>

              <p>
                <span className="font-medium text-slate-900">Style:</span> {style}
              </p>
              <p>
                <span className="font-medium text-slate-900">Care info:</span> {careInfo}
              </p>
            </div>

            <div className="pt-4">
              <Link
                href="/home"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <aside className="lg:sticky lg:top-4 lg:h-fit">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">${price.toFixed(2)}</span>
            <button className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
              Price history
            </button>
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>FREE delivery Sunday, July 26</p>
            <p className="font-medium text-slate-900">for members. Order within 3 hrs 30 mins</p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>Deliver to Acc Name - Westford 01234</span>
          </div>

          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">
            Only 1 left in stock - order soon
          </div>

          <div className="mt-4 space-y-2">
            <button className="w-full rounded-full bg-yellow-400 py-2 font-semibold text-slate-900 hover:bg-yellow-500">
              Add to cart
            </button>
            <button className="w-full rounded-full bg-orange-400 py-2 font-semibold text-white hover:bg-orange-500">
              Buy Now
            </button>
          </div>

          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-900">Shipper / Seller</span>
              <span className="text-slate-700">Amazon.com</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-900">Returns</span>
              <span className="text-blue-600">FREE 30-day refund/replacement</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-900">Gift options</span>
              <span className="text-blue-600">Available at checkout</span>
            </div>
          </div>

          <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700">
            ▼ See more
          </button>
        </div>
      </aside>
    </main>
  );
}
