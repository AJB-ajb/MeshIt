"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/client";

type Persona = "developer" | "project_owner";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<Persona | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => {
    const value = searchParams.get("next") ?? "";
    return value && !value.startsWith("/onboarding") ? value : "";
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        const persona = user.user_metadata?.persona as Persona | undefined;
        const profileCompleted = user.user_metadata?.profile_completed as
          | boolean
          | undefined;
        if (persona) {
          const destination =
            next ||
            (persona === "developer" && !profileCompleted
              ? "/onboarding/developer"
              : persona === "developer"
                ? "/dashboard"
                : "/projects/new");
          router.replace(destination);
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [next, router]);

  const handleSelect = async (persona: Persona) => {
    setError(null);
    setIsLoading(persona);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        persona,
        profile_completed: persona !== "developer",
      },
    });

    if (updateError) {
      setIsLoading(null);
      setError("We couldn't save your choice. Please try again.");
      return;
    }

    const destination =
      next ||
      (persona === "developer" ? "/onboarding/developer" : "/projects/new");
    router.replace(destination);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 lg:px-8">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16 lg:px-8">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold">Tell us why you&apos;re here</h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;ll tailor your experience based on your goal.
            </p>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Apply as a developer</CardTitle>
                <CardDescription>
                  Create your profile and get matched to projects that need your
                  skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleSelect("developer")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "developer" ? "Saving..." : "I&apos;m a developer"}
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle>Post a project</CardTitle>
                <CardDescription>
                  Share your requirements and find developers who match your
                  needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleSelect("project_owner")}
                  disabled={isLoading !== null}
                >
                  {isLoading === "project_owner"
                    ? "Saving..."
                    : "I&apos;m looking for developers"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
