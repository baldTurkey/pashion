import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDesignerByAccountId } from "@/lib/designers/queries";
import { Card } from "@/components/ui/card";

export default async function DesignerDashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session at all — nothing to show, send them to start signing up.
  if (!user) {
    redirect("/sign-up/designer");
  }

  const designer = await getDesignerByAccountId(supabase, user.id);

  // Session exists, but no designers row yet 
  if (!designer) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Card className="p-8">
          <h1 className="font-serif text-2xl text-brand-ink">Finish your profile</h1>
          <p className="mt-2 text-brand-ink/70">
            Your account was created, but we don&apos;t have your designer details yet.
            Please try signing up again to finish setting up your profile.
          </p>
          <Link
            href="/sign-up/designer"
            className="mt-6 inline-flex rounded-full bg-brand-accent px-6 py-2.5 text-white hover:bg-brand-olive-dark"
          >
            Finish signing up
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <Card className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-blush">
          <span className="font-serif text-2xl text-brand-olive-dark">
            {designer.artist_handle.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="font-serif text-2xl text-brand-ink">{designer.artist_handle}</h1>
        {designer.style && (
          <p className="text-xs uppercase tracking-wide text-brand-accent">{designer.style}</p>
        )}
        <p className="text-brand-ink/70">Welcome back! Your designer profile is live on Pashion.</p>
        {/* No public designer profile page yet */}
      </Card>
    </div>
  );
}