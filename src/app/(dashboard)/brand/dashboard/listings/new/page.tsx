import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/ui/coming-soon";

export default async function CreateListingPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  return (
    <ComingSoon
      title="Create Listing"
      description="Listing a clothing item for the marketplace is coming soon — this is where you'll upload photos, price, sizes, and care info."
      backHref="/brand/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
