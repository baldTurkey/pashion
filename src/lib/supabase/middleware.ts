import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// NextRequest/NextResponse are Next.js's typed wrappers around the standard
// web Request/Response objects, used specifically in middleware 
export async function updateSession(request: NextRequest) {

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies onto the incoming request too, so that if
          // a Server Component reads cookies() later in this same request, it
          // sees the up-to-date session instead of the stale one.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() — not getSession() — is what actually revalidates the token
  // against Supabase's auth server and refreshes it if it's close to expiring.
  // getSession() only reads whatever's already in the cookie locally, so it
  // can't tell you a token has been revoked; never use it for access checks.
  await supabase.auth.getUser();

  return supabaseResponse;
}