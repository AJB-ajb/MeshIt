"use client";

import { Users, Calendar, Clock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PostingDetail,
  PostingFormState,
} from "@/lib/hooks/use-posting-detail";

type PostingAboutCardProps = {
  posting: PostingDetail;
  isEditing: boolean;
  form: PostingFormState;
  onFormChange: (field: keyof PostingFormState, value: string) => void;
};

export function PostingAboutCard({
  posting,
  isEditing,
  form,
  onFormChange,
}: PostingAboutCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About this posting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <textarea
            value={form.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        ) : (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {posting.description}
          </p>
        )}

        {/* Skills */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Skills</h4>
          {isEditing ? (
            <Input
              value={form.skills}
              onChange={(e) => onFormChange("skills", e.target.value)}
              placeholder="React, TypeScript, Node.js (comma-separated)"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {posting.skills?.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
              {(!posting.skills || posting.skills.length === 0) && (
                <span className="text-sm text-muted-foreground">
                  No specific skills listed
                </span>
              )}
            </div>
          )}
        </div>

        {/* Meta */}
        {isEditing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estimated Time</label>
              <Input
                value={form.estimatedTime}
                onChange={(e) => onFormChange("estimatedTime", e.target.value)}
                placeholder="e.g., 2 weeks, 1 month"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                value={form.category}
                onChange={(e) => onFormChange("category", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="study">Study</option>
                <option value="hackathon">Hackathon</option>
                <option value="personal">Personal</option>
                <option value="professional">Professional</option>
                <option value="social">Social</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Size Min</label>
              <select
                value={form.teamSizeMin}
                onChange={(e) => onFormChange("teamSizeMin", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Size Max</label>
              <select
                value={form.teamSizeMax}
                onChange={(e) => onFormChange("teamSizeMax", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mode</label>
              <select
                value={form.mode}
                onChange={(e) => onFormChange("mode", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="friend_ask">Friend Ask</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => onFormChange("status", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="filled">Filled</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Team Size</p>
              <p className="font-medium">
                {posting.team_size_min}-{posting.team_size_max} people
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Estimated Time
              </p>
              <p className="font-medium">
                {posting.estimated_time || "Not specified"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Category</p>
              <p className="font-medium capitalize">
                {posting.category || "Not specified"}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
