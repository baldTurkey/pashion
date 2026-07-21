import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/ui/coming-soon";

// Generic — reachable from any logged-in role's dashboard nav, so this just
// checks for a session rather than a specific brand/designer row.
export default async function AccountPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <ComingSoon
      title="Manage Account"
      description="Editing your account details, password, and notification preferences is coming soon."
      backHref="/"
      backLabel="Back to home"
    />
  );
}
