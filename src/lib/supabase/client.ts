import { createBrowserClient } from "@supabase/ssr";

// Next inlines NEXT_PUBLIC_* only for literal property access, so read them directly here.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
