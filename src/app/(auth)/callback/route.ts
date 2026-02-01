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

      if (!user) {
        return NextResponse.redirect(
          `${origin}/login?error=Authentication%20failed`
        );
      }

      // Check if user has a profile in the database (existing user)
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .eq("user_id", user.id)
        .single();

      // If user has a profile in the database, they're an existing user - go to dashboard
      if (profile) {
        // Ensure profile_completed is set in metadata
        const profileCompleted = user.user_metadata?.profile_completed;
        if (!profileCompleted) {
          await supabase.auth.updateUser({
            data: {
              profile_completed: true,
            },
          });
        }
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if user has projects (existing user)
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("creator_id", user.id)
        .limit(1);

      if (projects && projects.length > 0) {
        // Existing user with projects - ensure profile_completed is set
        const profileCompleted = user.user_metadata?.profile_completed;
        if (!profileCompleted) {
          await supabase.auth.updateUser({
            data: {
              profile_completed: true,
            },
          });
        }
        return NextResponse.redirect(`${origin}${next}`);
      }

      // New user - send directly to onboarding form
      // Check if profile is completed
      const profileCompleted = user.user_metadata?.profile_completed;

      if (!profileCompleted) {
        // Brand new user - send directly to onboarding form
        const destination = `/onboarding/developer?next=${encodeURIComponent(next)}`;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      // User has completed profile
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Authentication%20failed`
  );
}
