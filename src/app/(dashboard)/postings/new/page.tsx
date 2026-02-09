"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mic,
  Loader2,
  Sparkles,
  FileText,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { getTestDataValue } from "@/lib/environment";

type InputMode = "form" | "ai";

type PostingFormState = {
  title: string;
  description: string;
  skills: string;
  estimatedTime: string;
  teamSizeMin: string;
  teamSizeMax: string;
  category: string;
  mode: string;
};

const defaultFormState: PostingFormState = {
  title: "",
  description: "",
  skills: "",
  estimatedTime: "",
  teamSizeMin: "2",
  teamSizeMax: "5",
  category: "personal",
  mode: "remote",
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function NewPostingPage() {
  const router = useRouter();
  const [form, setForm] = useState<PostingFormState>(defaultFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("form");
  const [aiText, setAiText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  const handleChange = (field: keyof PostingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAiExtract = async () => {
    if (!aiText.trim()) {
      setError("Please paste some text to extract posting information from.");
      return;
    }

    setError(null);
    setIsExtracting(true);
    setExtractionSuccess(false);

    try {
      const response = await fetch("/api/extract/posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract posting");
      }

      const extracted = data.posting;

      // Map extracted data to form state
      setForm({
        title: extracted.title || form.title,
        description: extracted.description || form.description,
        skills: Array.isArray(extracted.skills)
          ? extracted.skills.join(", ")
          : form.skills,
        estimatedTime: extracted.estimated_time || form.estimatedTime,
        teamSizeMin: extracted.team_size_min?.toString() || form.teamSizeMin,
        teamSizeMax: extracted.team_size_max?.toString() || form.teamSizeMax,
        category: extracted.category || form.category,
        mode: extracted.mode || form.mode,
      });

      setExtractionSuccess(true);
      // Switch to form mode to review extracted data
      setTimeout(() => {
        setInputMode("form");
        setExtractionSuccess(false);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to extract posting",
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Please enter a posting title.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a posting description.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSaving(false);
      setError("Please sign in to create a posting.");
      return;
    }

    // First check if user has a profile (required for creator_id foreign key)
    const { data: profile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected if profile doesn't exist
      setIsSaving(false);
      console.error("Profile check error:", profileCheckError);
      setError("Failed to verify your profile. Please try again.");
      return;
    }

    if (!profile) {
      // Create a minimal profile if it doesn't exist
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        is_test_data: getTestDataValue(),
      });

      if (profileError) {
        setIsSaving(false);
        console.error("Profile creation error:", profileError);
        setError(
          `Failed to create user profile: ${profileError.message || "Please try again."}`,
        );
        return;
      }
    }

    // 90-day default expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const { data: posting, error: insertError } = await supabase
      .from("postings")
      .insert({
        creator_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        skills: parseList(form.skills),
        estimated_time: form.estimatedTime || null,
        team_size_min: Number(form.teamSizeMin),
        team_size_max: Number(form.teamSizeMax),
        category: form.category,
        mode: form.mode,
        status: "open",
        expires_at: expiresAt.toISOString(),
        is_test_data: getTestDataValue(),
      })
      .select()
      .single();

    setIsSaving(false);

    if (insertError) {
      console.error("Insert error:", insertError);

      // Provide more specific error messages
      let errorMessage = "Failed to create posting. Please try again.";

      if (insertError.code === "23503") {
        // Foreign key violation - profile doesn't exist
        errorMessage =
          "Your profile is missing. Please complete your profile first.";
      } else if (insertError.code === "23505") {
        // Unique violation
        errorMessage = "A posting with this information already exists.";
      } else if (insertError.code === "23514") {
        // Check constraint violation
        errorMessage = `Invalid posting data: ${insertError.message}`;
      } else if (insertError.message) {
        errorMessage = `Failed to create posting: ${insertError.message}`;
      }

      setError(errorMessage);
      return;
    }

    // Redirect to the new posting's page
    router.push(`/postings/${posting.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/postings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to postings
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Posting</h1>
        <p className="mt-1 text-muted-foreground">
          Describe your posting and let AI find the perfect collaborators
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Input Mode Toggle */}
      <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setInputMode("form")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            inputMode === "form"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          Fill Form
        </button>
        <button
          type="button"
          onClick={() => setInputMode("ai")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            inputMode === "ai"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI Extract
        </button>
      </div>

      {/* AI Text Input Mode */}
      {inputMode === "ai" && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Posting Extraction
            </CardTitle>
            <CardDescription>
              Paste your posting description from Slack, Discord, a GitHub
              README, or any text. Our AI will automatically extract posting
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              rows={12}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder={`Paste your project text here...

Example:
Hey everyone! Looking for 2-3 devs to join my hackathon project this weekend 🚀

Building an AI-powered recipe generator that suggests meals based on what's in your fridge. 

Tech stack: React, TypeScript, OpenAI API, Supabase
Need: Frontend dev + someone with AI/ML experience
Commitment: ~10 hrs over the weekend

DM if interested!`}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleAiExtract}
                disabled={isExtracting || !aiText.trim()}
                className="flex-1"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : extractionSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Extracted!
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract Posting Details
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInputMode("form")}
              >
                Switch to Form
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              After extraction, youll be able to review and edit the extracted
              information before creating your posting.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {inputMode === "form" && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Posting Details</CardTitle>
              <CardDescription>
                Tell us about your posting in plain language. You can paste from
                Slack, Discord, or describe it yourself.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Posting Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g., AI Recipe Generator"
                  className="text-lg"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    rows={6}
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe your project and what kind of collaborators you're looking for...

Example: Building a Minecraft-style collaborative IDE, need 2-3 people with WebGL or game dev experience, hackathon this weekend."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-2 right-2"
                    title="Use voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Our AI will extract skills, team size, and timeline from your
                  description.
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <label htmlFor="skills" className="text-sm font-medium">
                  Skills (comma-separated)
                </label>
                <Input
                  id="skills"
                  value={form.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  placeholder="e.g., React, TypeScript, Node.js, AI/ML"
                />
              </div>

              {/* Estimated Time and Category */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="estimated-time"
                    className="text-sm font-medium"
                  >
                    Estimated Time
                  </label>
                  <Input
                    id="estimated-time"
                    value={form.estimatedTime}
                    onChange={(e) =>
                      handleChange("estimatedTime", e.target.value)
                    }
                    placeholder="e.g., 2 weeks, 1 month"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="study">Study</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="personal">Personal</option>
                    <option value="professional">Professional</option>
                    <option value="social">Social</option>
                  </select>
                </div>
              </div>

              {/* Team size and Mode */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label
                    htmlFor="team-size-min"
                    className="text-sm font-medium"
                  >
                    Team Size Min
                  </label>
                  <select
                    id="team-size-min"
                    value={form.teamSizeMin}
                    onChange={(e) =>
                      handleChange("teamSizeMin", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="team-size-max"
                    className="text-sm font-medium"
                  >
                    Team Size Max
                  </label>
                  <select
                    id="team-size-max"
                    value={form.teamSizeMax}
                    onChange={(e) =>
                      handleChange("teamSizeMax", e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="10">10</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="mode" className="text-sm font-medium">
                    Mode
                  </label>
                  <select
                    id="mode"
                    value={form.mode}
                    onChange={(e) => handleChange("mode", e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="remote">Remote</option>
                    <option value="in_person">In Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSaving || isExtracting}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Posting"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/postings">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Info */}
      <p className="text-center text-sm text-muted-foreground">
        {inputMode === "ai"
          ? "Paste your posting description and let AI extract the details automatically."
          : "After creating your posting, our AI will immediately start finding matching collaborators based on your description."}
      </p>
    </div>
  );
}
