import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { AccountManager } from "@/components/account/account-manager";

export default async function AccountPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AccountManager user={user} />;
}
