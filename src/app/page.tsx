import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If logged in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:px-8 lg:py-24">
          {/* AI Badge */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">AI-powered matching</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="max-w-4xl animate-slide-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find your perfect
            <br />
            project match.
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl animate-slide-up text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "100ms" }}>
            Stop posting &quot;looking for teammates&quot; in Slack. Describe your project in
            plain language, and let AI find the 3-5 people most likely to be a
            great fit.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 animate-slide-up sm:flex-row" style={{ animationDelay: "200ms" }}>
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/login">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8" asChild>
              <Link href="/projects">Explore postings</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-muted/30 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              From profile to project match in minutes, not hours.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-border/80 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="text-xl font-semibold">Create your profile</h3>
                <p className="mt-2 text-muted-foreground">
                  Tell us about yourself in 30 seconds. Voice or text — AI
                  extracts your skills, interests, and availability.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-border/80 hover:shadow-lg">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="text-xl font-semibold">AI finds your matches</h3>
                <p className="mt-2 text-muted-foreground">
                  Our semantic matching engine understands what you bring and
                  what projects need — then connects them intelligently.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-border/80 hover:shadow-lg sm:col-span-2 lg:col-span-1">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="text-xl font-semibold">Connect and collaborate</h3>
                <p className="mt-2 text-muted-foreground">
                  See why you matched, message your team, and start building
                  together. Its that simple.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to find your match?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join developers who are building their next project with the
              perfect team.
            </p>
            <div className="mt-8">
              <Button size="lg" className="gap-2 px-8" asChild>
                <Link href="/login">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
          <p className="text-sm text-muted-foreground">
            © 2026 MeshIt. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
