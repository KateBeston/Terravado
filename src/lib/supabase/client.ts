/* Browser Supabase client. Reads public env vars. Row-level security enforces
   tenancy, so the publishable (anon) key is safe to expose. */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
