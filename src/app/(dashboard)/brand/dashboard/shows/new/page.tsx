import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/ui/coming-soon";

export default async function CreateShowPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-up/brand");
  }

  return (
    <ComingSoon
      title="Post a Show"
      description="Launching a design contest is coming soon, you'll be able to set a duration, quantity, materials, and requirements for designers."
      backHref="/brand/dashboard"
      backLabel="Back to dashboard"
    />
  );
}
