import { createServerClient } from '@supabase/ssr';
// @ts-ignore: next/headers may be unavailable in some Next.js versions
import { cookies } from 'next/headers';

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The Next.js Server Components architecture sometimes blocks setting cookies 
            // if called from a pure static page view; we can safely ignore those errors here.
          }
        },
      },
    }
  );
}