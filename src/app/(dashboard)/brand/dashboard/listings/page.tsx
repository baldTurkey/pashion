import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/ui/coming-soon";

export default async function ManageListingsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  return (
    <ComingSoon
      title="Your Listings"
      description="Managing and editing listings is coming soon — once you've created your first listing, it'll show up here."
      backHref="/brand/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
