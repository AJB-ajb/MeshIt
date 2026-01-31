"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard";

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    const supabase = createClient();
    const callbackUrl = new URL("/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);

    const supabase = createClient();
    const callbackUrl = new URL("/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to continue to MeshIt.
        </p>
      </div>

      {error ? (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        <Button
          type="button"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? "Redirecting..." : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGitHubSignIn}
          disabled={isLoading}
        >
          {isLoading ? "Redirecting..." : "Continue with GitHub"}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 lg:px-8">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16 lg:px-8">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                  Sign in to continue to MeshIt.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <Button type="button" className="w-full" disabled>
                  Loading...
                </Button>
              </div>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
