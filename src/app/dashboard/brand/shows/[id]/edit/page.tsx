import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getBrandByAccountId } from "@/lib/brands/queries";
import EditShowForm from "./EditShowForm";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  const brand = await getBrandByAccountId(supabase, user.id);

  if (!brand) {
    redirect("/sign-up/brand");
  }

  const { data: show, error } = await supabase
    .from("shows")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !show) {
    notFound();
  }

  // Only the owning brand can edit this show.
  if (show.brand_id !== brand.brand_uuid) {
    notFound();
  }

  return <EditShowForm show={show} />;
}