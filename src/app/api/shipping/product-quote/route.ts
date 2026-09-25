import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { calculateShippingQuotesForBrands, geocodeAddress } from "@/lib/shipping/calculate";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productId?: unknown; address?: unknown };
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";

    if (!productId || !address) {
      return NextResponse.json({ error: "Product and delivery address are required." }, { status: 400 });
    }

    const adminClient = getAdminClient();
    let productQuery = await adminClient
      .from("products")
      .select("brand_id")
      .eq("product_id", productId)
      .eq("listing_status", "published")
      .maybeSingle();

    if (!productQuery.data) {
      productQuery = await adminClient
        .from("products")
        .select("brand_id")
        .eq("id", productId)
        .eq("listing_status", "published")
        .maybeSingle();
    }

    if (productQuery.error) throw productQuery.error;
    if (!productQuery.data?.brand_id) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const destination = await geocodeAddress(address);
    const result = await calculateShippingQuotesForBrands(
      adminClient,
      [productQuery.data.brand_id],
      destination
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate shipping." },
      { status: 400 }
    );
  }
}