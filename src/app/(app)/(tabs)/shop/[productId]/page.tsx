import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";

type Product = {
  id: string;
  product_id?: string | null;
  name?: string | null;
  description?: string | null;
  size?: string | null;
  product_size?: string | null;
  size_guide?: string | null;
  sizeGuide?: string | null;
  size_guide_url?: string | null;
  sizeGuideUrl?: string | null;
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
  const { productId } = await params;
  const routeId = decodeURIComponent(productId);
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
  const deliveryPrice = Number(product.deliveryPrice ?? product.delivery_price ?? 0);
  const deliveryInDays = Number(product.deliveryInDays ?? product.delivery_in_days ?? 3);
  const size = product.size ?? product.product_size ?? null;
  const sizeGuide = product.sizeGuide ?? product.size_guide ?? null;
  const sizeGuideUrl = product.sizeGuideUrl ?? product.size_guide_url ?? null;

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{name}</h1>
        <p className="mt-3 text-sm text-slate-500">Unique product route id: {routeId}</p>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="h-72 w-full overflow-hidden rounded-xl bg-slate-100">
            {imageUrl ? (
              // Use img so existing remote image URLs work without next/image config changes.
              <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No image
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-2xl font-semibold text-slate-900">$ {price}</p>
            <p className="text-slate-600">Size: {size && String(size).trim().length > 0 ? size : "N/A"}</p>
            <p className="text-slate-600">Delivery: $ {deliveryPrice}</p>
            <p className="text-slate-600">Delivery in {deliveryInDays} day(s)</p>
            {product.description && <p className="pt-2 text-slate-700">{product.description}</p>}

            <div className="pt-4">
              {sizeGuideUrl && String(sizeGuideUrl).trim().length > 0 ? (
                <a
                  href={sizeGuideUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mr-3 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Open size guide
                </a>
              ) : sizeGuide && String(sizeGuide).trim().length > 0 ? (
                <details className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <summary className="w-fit cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    Open size guide
                  </summary>
                  <p className="pt-3 text-sm text-slate-700">{sizeGuide}</p>
                </details>
              ) : null}
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
    </main>
  );
}
