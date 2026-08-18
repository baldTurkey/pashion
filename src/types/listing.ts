export interface Listing {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  size: string | null;
  inventory: number;
  image_url: string | null;
  status: "draft" | "live";
  created_at: string;
}
