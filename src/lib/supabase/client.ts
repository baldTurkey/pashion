import { createBrowserClient } from '@supabase/ssr';

// Creates a single, reusable connection instance shared across the browser session
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function createClient() {
  return supabaseBrowser;
}