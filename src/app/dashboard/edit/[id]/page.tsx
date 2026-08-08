import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import EditListingForm from "@/editlisting";

export default async function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServer();

  const { data: listing, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !listing) {
    notFound();
  }

  return <EditListingForm listing={listing} />;
}