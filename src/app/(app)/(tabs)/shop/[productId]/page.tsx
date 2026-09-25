import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import { ProductShippingEstimate } from "@/components/shop/product-shipping-estimate";
import { parseCustomerContactInfo } from "@/lib/customers/contact-info";

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
  stock?: number | null;
  brands?: { company_name: string; slug: string; shipping_range: string | null } | null;
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
    .select("*, brands(company_name, slug, shipping_range)")
    .eq("product_id", routeId)
    .eq("listing_status", "published")
    .maybeSingle();

  if (byProductId.data) {
    return byProductId.data as Product;
  }

  const byId = await supabase
    .from("products")
    .select("*, brands(company_name, slug, shipping_range)")
    .eq("id", routeId)
    .eq("listing_status", "published")
    .maybeSingle();
  if (byId.data) {
    return byId.data as Product;
  }

  return null;
}

async function getDeliveryLocation(): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("customers")
    .select("contact_info")
    .eq("customer_uuid", user.id)
    .maybeSingle();
  return parseCustomerContactInfo(data?.contact_info).location ?? null;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const routeId = decodeURIComponent(resolvedParams.productId);
  const product = await getProductByRouteId(routeId);
  const deliveryLocation = await getDeliveryLocation();

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

  const stock = product.stock ?? null;
  const outOfStock = stock === 0;
  const stockMessage =
    stock === null ? "In stock" : outOfStock ? "Out of stock" : stock <= 5 ? `Only ${stock} left in stock` : "In stock";

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
          </div>

          <div className="mt-4 space-y-1 text-sm text-slate-600">
            <p>{product.brands?.shipping_range ? `Ships to ${product.brands.shipping_range}` : "Shipping calculated at checkout"}</p>
          </div>

          <ProductShippingEstimate
            productId={product.product_id ?? product.id}
            initialAddress={deliveryLocation ?? ""}
            itemPrice={price}
          />

          <div
            className={`mt-4 rounded-lg p-3 text-sm font-medium ${
              outOfStock ? "bg-red-50 text-red-700" : stock !== null && stock <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {stockMessage}
          </div>

          <div className="mt-4 space-y-2">
            {product.product_id && (
              <AddToCartButton
                productId={product.product_id}
                disabled={outOfStock}
                className="w-full rounded-full bg-yellow-400 py-2 font-semibold text-slate-900 hover:bg-yellow-500 disabled:opacity-60"
              />
            )}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-medium text-slate-900">Sold by</span>
              {product.brands ? (
                <Link href={`/brands/${product.brands.slug}`} className="text-blue-600 hover:underline">
                  {product.brands.company_name}
                </Link>
              ) : (
                <span className="text-slate-700">Unknown brand</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
