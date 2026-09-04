import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import EditListingForm from "./editlisting.jsx";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: listing, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !listing) {
    notFound();
  }

  return <EditListingForm listing={listing} />;
}