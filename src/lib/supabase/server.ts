import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set SUPABASE_URL/SUPABASE_ANON_KEY (server) and NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY (client)."
    );
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookies can only be modified in Server Actions or Route Handlers
            // Silently fail in read-only contexts (e.g., during page rendering)
            // The cookie will be set on the next mutation request
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Cookies can only be modified in Server Actions or Route Handlers
            // Silently fail in read-only contexts
          }
        },
      },
    }
  );
}
