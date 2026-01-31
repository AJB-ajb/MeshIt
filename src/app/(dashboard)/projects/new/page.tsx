"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mic, Loader2, Sparkles, FileText, CheckCircle } from "lucide-react";

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

type InputMode = "form" | "ai";

type ProjectFormState = {
  title: string;
  description: string;
  requiredSkills: string;
  timeline: string;
  commitmentHours: string;
  teamSize: string;
  experienceLevel: string;
};

const defaultFormState: ProjectFormState = {
  title: "",
  description: "",
  requiredSkills: "",
  timeline: "1_month",
  commitmentHours: "10",
  teamSize: "3",
  experienceLevel: "any",
};

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProjectFormState>(defaultFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("form");
  const [aiText, setAiText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  const handleChange = (field: keyof ProjectFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAiExtract = async () => {
    if (!aiText.trim()) {
      setError("Please paste some text to extract project information from.");
      return;
    }

    setError(null);
    setIsExtracting(true);
    setExtractionSuccess(false);

    try {
      const response = await fetch("/api/extract/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract project");
      }

      const project = data.project;

      // Map extracted data to form state
      setForm({
        title: project.title || form.title,
        description: project.description || form.description,
        requiredSkills: Array.isArray(project.required_skills)
          ? project.required_skills.join(", ")
          : form.requiredSkills,
        timeline: project.timeline || form.timeline,
        commitmentHours: project.commitment_hours?.toString() || form.commitmentHours,
        teamSize: project.team_size?.toString() || form.teamSize,
        experienceLevel: project.experience_level || form.experienceLevel,
      });

      setExtractionSuccess(true);
      // Switch to form mode to review extracted data
      setTimeout(() => {
        setInputMode("form");
        setExtractionSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract project");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Please enter a project title.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter a project description.");
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
      setError("Please sign in to create a project.");
      return;
    }

    // First check if user has a profile (required for creator_id foreign key)
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      // Create a minimal profile if it doesn't exist
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      });

      if (profileError) {
        setIsSaving(false);
        setError("Failed to create user profile. Please try again.");
        return;
      }
    }

    // Calculate expires_at based on timeline
    const now = new Date();
    let expiresAt: Date;
    switch (form.timeline) {
      case "weekend":
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        break;
      case "1_week":
        expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks
        break;
      case "1_month":
        expiresAt = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days
        break;
      case "ongoing":
      default:
        expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
        break;
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        creator_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        required_skills: parseList(form.requiredSkills),
        timeline: form.timeline,
        commitment_hours: Number(form.commitmentHours),
        team_size: Number(form.teamSize),
        experience_level: form.experienceLevel,
        status: "open",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    setIsSaving(false);

    if (insertError) {
      console.error("Insert error:", insertError);
      setError("Failed to create project. Please try again.");
      return;
    }

    // Redirect to the new project's page
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
        <p className="mt-1 text-muted-foreground">
          Describe your project and let AI find the perfect collaborators
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
              AI Project Extraction
            </CardTitle>
            <CardDescription>
              Paste your project description from Slack, Discord, a GitHub README, or any text. 
              Our AI will automatically extract project details.
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
                    Extract Project Details
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
              After extraction, youll be able to review and edit the extracted information before creating your project.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {inputMode === "form" && (
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Tell us about your project in plain language. You can paste from
              Slack, Discord, or describe it yourself.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Project Title <span className="text-destructive">*</span>
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
                  onChange={(e) => handleChange("description", e.target.value)}
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

            {/* Required Skills */}
            <div className="space-y-2">
              <label htmlFor="requiredSkills" className="text-sm font-medium">
                Required Skills (comma-separated)
              </label>
              <Input
                id="requiredSkills"
                value={form.requiredSkills}
                onChange={(e) => handleChange("requiredSkills", e.target.value)}
                placeholder="e.g., React, TypeScript, Node.js, AI/ML"
              />
            </div>

            {/* Timeline and Commitment */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="timeline" className="text-sm font-medium">
                  Timeline
                </label>
                <select
                  id="timeline"
                  value={form.timeline}
                  onChange={(e) => handleChange("timeline", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="weekend">This weekend</option>
                  <option value="1_week">1 week</option>
                  <option value="1_month">1 month</option>
                  <option value="ongoing">Ongoing</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="commitment" className="text-sm font-medium">
                  Time Commitment
                </label>
                <select
                  id="commitment"
                  value={form.commitmentHours}
                  onChange={(e) => handleChange("commitmentHours", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="5">5 hrs/week</option>
                  <option value="10">10 hrs/week</option>
                  <option value="15">15 hrs/week</option>
                  <option value="20">20+ hrs/week</option>
                </select>
              </div>
            </div>

            {/* Team size and Experience */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="team-size" className="text-sm font-medium">
                  Team Size
                </label>
                <select
                  id="team-size"
                  value={form.teamSize}
                  onChange={(e) => handleChange("teamSize", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4 people</option>
                  <option value="5">5 people</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="experience-level" className="text-sm font-medium">
                  Experience Level Needed
                </label>
                <select
                  id="experience-level"
                  value={form.experienceLevel}
                  onChange={(e) => handleChange("experienceLevel", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="any">Any level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={isSaving || isExtracting}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      )}

      {/* Info */}
      <p className="text-center text-sm text-muted-foreground">
        {inputMode === "ai" 
          ? "Paste your project description and let AI extract the details automatically."
          : "After creating your project, our AI will immediately start finding matching collaborators based on your description."
        }
      </p>
    </div>
  );
}
