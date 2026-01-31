import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const persona = user?.user_metadata?.persona;
      const profileCompleted = user?.user_metadata?.profile_completed;

      if (!persona) {
        const destination = `/onboarding?next=${encodeURIComponent(next)}`;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      if (persona === "developer" && !profileCompleted) {
        const destination = `/onboarding/developer?next=${encodeURIComponent(
          next
        )}`;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Authentication%20failed`
  );
}
