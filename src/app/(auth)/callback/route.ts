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
        // Ensure user metadata is synced (in case it was lost)
        const persona = user.user_metadata?.persona;
        if (!persona) {
          // User has a profile but no persona in metadata - they're a developer
          await supabase.auth.updateUser({
            data: {
              persona: "developer",
              profile_completed: true,
            },
          });
        }
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Check if user is a project owner (has projects but no profile)
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("creator_id", user.id)
        .limit(1);

      if (projects && projects.length > 0) {
        // User is a project owner - ensure metadata is set
        const persona = user.user_metadata?.persona;
        if (!persona) {
          await supabase.auth.updateUser({
            data: {
              persona: "project_owner",
              profile_completed: true,
            },
          });
        }
        return NextResponse.redirect(`${origin}${next}`);
      }

      // New user - check user metadata for persona selection
      const persona = user.user_metadata?.persona;
      const profileCompleted = user.user_metadata?.profile_completed;

      if (!persona) {
        // Brand new user - send to onboarding to choose persona
        const destination = `/onboarding?next=${encodeURIComponent(next)}`;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      if (persona === "developer" && !profileCompleted) {
        // Developer who hasn't completed profile
        const destination = `/onboarding/developer?next=${encodeURIComponent(
          next
        )}`;
        return NextResponse.redirect(`${origin}${destination}`);
      }

      // User has persona and profile is completed
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Authentication%20failed`
  );
}
