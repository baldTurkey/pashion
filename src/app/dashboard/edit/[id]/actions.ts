"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function updateListing(formData: FormData) {
  const supabase = await createSupabaseServer();

  const id = formData.get("id") as string;

  const updates = {
    name: formData.get("name") as string,
    currentPrice: Number(formData.get("currentPrice")),
    description: formData.get("description") as string,
    size: formData.get("size") as string,
    style: formData.get("style") as string,
    size_guide_url: (formData.get("size_guide_url") as string) || null,
    care_info: formData.get("care_info") as string,
  };

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/listings/${id}`);
  redirect(`/dashboard/listings/${id}`);
}