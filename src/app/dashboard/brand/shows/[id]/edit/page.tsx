import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import EditShowForm from "./EditShowForm";

export default async function EditShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServer();

  const { data: show, error } = await supabase
    .from("shows")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !show) {
    notFound();
  }

  return <EditShowForm show={show} />;
}