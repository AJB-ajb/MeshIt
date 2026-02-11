"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { transcribeAudio } from "@/lib/transcribe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type PostingFormState = {
  title: string;
  description: string;
  skills: string;
  estimatedTime: string;
  teamSizeMin: string;
  teamSizeMax: string;
  category: string;
  mode: string;
};

export const defaultFormState: PostingFormState = {
  title: "",
  description: "",
  skills: "",
  estimatedTime: "",
  teamSizeMin: "2",
  teamSizeMax: "5",
  category: "personal",
  mode: "open",
};

type PostingFormCardProps = {
  form: PostingFormState;
  onChange: (field: keyof PostingFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
  isExtracting: boolean;
};

export function PostingFormCard({
  form,
  onChange,
  onSubmit,
  isSaving,
  isExtracting,
}: PostingFormCardProps) {
  return (
    <form onSubmit={onSubmit}>
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
              onChange={(e) => onChange("title", e.target.value)}
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
                onChange={(e) => onChange("description", e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your project and what kind of collaborators you're looking for...

Example: Building a Minecraft-style collaborative IDE, need 2-3 people with WebGL or game dev experience, hackathon this weekend."
              />
              <SpeechInput
                className="absolute bottom-2 right-2 h-10 w-10 p-0"
                size="icon"
                variant="ghost"
                type="button"
                onAudioRecorded={transcribeAudio}
                onTranscriptionChange={(text) =>
                  onChange(
                    "description",
                    form.description ? form.description + " " + text : text,
                  )
                }
              />
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
              onChange={(e) => onChange("skills", e.target.value)}
              placeholder="e.g., React, TypeScript, Node.js, AI/ML"
            />
          </div>

          {/* Estimated Time and Category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="estimated-time" className="text-sm font-medium">
                Estimated Time
              </label>
              <Input
                id="estimated-time"
                value={form.estimatedTime}
                onChange={(e) => onChange("estimatedTime", e.target.value)}
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
                onChange={(e) => onChange("category", e.target.value)}
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
              <label htmlFor="team-size-min" className="text-sm font-medium">
                Team Size Min
              </label>
              <select
                id="team-size-min"
                value={form.teamSizeMin}
                onChange={(e) => onChange("teamSizeMin", e.target.value)}
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
              <label htmlFor="team-size-max" className="text-sm font-medium">
                Team Size Max
              </label>
              <select
                id="team-size-max"
                value={form.teamSizeMax}
                onChange={(e) => onChange("teamSizeMax", e.target.value)}
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
                onChange={(e) => onChange("mode", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="open">Open</option>
                <option value="friend_ask">Friend Ask</option>
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
  );
}
