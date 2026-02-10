"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Share2,
  Flag,
  MessageSquare,
  RefreshCw,
  Check,
  Sparkles,
  Loader2,
  Pencil,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { MatchBreakdown } from "@/components/match/match-breakdown";
import type { ScoreBreakdown, Profile } from "@/lib/supabase/types";
import { formatScore } from "@/lib/matching/scoring";
import { getInitials } from "@/lib/format";

type Posting = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  team_size_min: number;
  team_size_max: number;
  estimated_time: string;
  category: string;
  mode: string;
  status: string;
  created_at: string;
  expires_at: string;
  creator_id: string;
  profiles?: {
    full_name: string | null;
    headline: string | null;
    skills: string[] | null;
    user_id: string;
  };
};

type Application = {
  id: string;
  status: string;
  cover_message: string | null;
  created_at: string;
  applicant_id: string;
  profiles?: {
    full_name: string | null;
    headline: string | null;
    skills: string[] | null;
    user_id: string;
  };
};

type MatchedProfile = {
  profile_id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  skills: string[] | null;
  overall_score: number;
  breakdown: ScoreBreakdown;
};

type PostingFormState = {
  title: string;
  description: string;
  skills: string;
  estimatedTime: string;
  teamSizeMin: string;
  teamSizeMax: string;
  category: string;
  mode: string;
  status: string;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const isExpired = (expiresAt: string | null) => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const formatExpiry = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)} days ago`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays < 7) return `Expires in ${diffDays} days`;
  if (diffDays < 30) return `Expires in ${Math.floor(diffDays / 7)} weeks`;
  return `Expires ${date.toLocaleDateString()}`;
};

export default function PostingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postingId = params.id as string;

  const [posting, setPosting] = useState<Posting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(
    null,
  );
  const [matchBreakdown, setMatchBreakdown] = useState<ScoreBreakdown | null>(
    null,
  );
  const [isComputingMatch, setIsComputingMatch] = useState(false);
  const [form, setForm] = useState<PostingFormState>({
    title: "",
    description: "",
    skills: "",
    estimatedTime: "",
    teamSizeMin: "2",
    teamSizeMax: "5",
    category: "personal",
    mode: "open",
    status: "open",
  });

  // Application state
  const [hasApplied, setHasApplied] = useState(false);
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverMessage, setCoverMessage] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isUpdatingApplication, setIsUpdatingApplication] = useState<
    string | null
  >(null);

  // Matched profiles state (for owners)
  const [matchedProfiles, setMatchedProfiles] = useState<MatchedProfile[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  // Fetch matched profiles for posting owner
  const fetchMatchedProfiles = useCallback(
    async (targetPostingId: string, ownerUserId: string | null) => {
      setIsLoadingMatches(true);
      const supabase = createClient();

      try {
        // Fetch all profiles
        const { data: allProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select(
            "user_id, full_name, headline, skills, skill_levels, location_preference, availability_slots",
          );

        if (profilesError || !allProfiles) {
          console.error("Failed to fetch profiles:", profilesError);
          return;
        }

        // Compute match breakdown for each profile
        const matchedProfilesData: MatchedProfile[] = [];

        for (const profile of allProfiles) {
          // Skip if this is the posting owner
          if (profile.user_id === ownerUserId) continue;

          try {
            const { data: breakdown, error: breakdownError } =
              await supabase.rpc("compute_match_breakdown", {
                profile_user_id: profile.user_id,
                target_posting_id: targetPostingId,
              });

            if (!breakdownError && breakdown) {
              const overallScore =
                breakdown.semantic * 0.3 +
                breakdown.availability * 0.3 +
                breakdown.skill_level * 0.2 +
                breakdown.location * 0.2;

              matchedProfilesData.push({
                profile_id: profile.user_id,
                user_id: profile.user_id,
                full_name: profile.full_name,
                headline: profile.headline,
                skills: profile.skills,
                overall_score: overallScore,
                breakdown: breakdown as ScoreBreakdown,
              });
            }
          } catch (err) {
            console.error(
              `Failed to compute match for profile ${profile.user_id}:`,
              err,
            );
          }
        }

        // Sort by overall score descending and take top 10
        matchedProfilesData.sort((a, b) => b.overall_score - a.overall_score);
        setMatchedProfiles(matchedProfilesData.slice(0, 10));
      } catch (err) {
        console.error("Failed to fetch matched profiles:", err);
      } finally {
        setIsLoadingMatches(false);
      }
    },
    [],
  );

  useEffect(() => {
    const fetchPosting = async () => {
      setIsLoading(true);
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);

      // Fetch posting with creator profile
      const { data, error } = await supabase
        .from("postings")
        .select(
          `
          *,
          profiles:creator_id (
            full_name,
            headline,
            skills,
            user_id
          )
        `,
        )
        .eq("id", postingId)
        .single();

      if (error || !data) {
        console.error("Error fetching posting:", error);
        setIsLoading(false);
        return;
      }

      setPosting(data);
      const ownerCheck = user?.id === data.creator_id;
      setIsOwner(ownerCheck);
      setForm({
        title: data.title,
        description: data.description,
        skills: data.skills?.join(", ") || "",
        estimatedTime: data.estimated_time || "",
        teamSizeMin: data.team_size_min?.toString() || "2",
        teamSizeMax: data.team_size_max?.toString() || "5",
        category: data.category || "personal",
        mode: data.mode || "open",
        status: data.status || "open",
      });

      // Check if user has already applied (for non-owners)
      if (user && !ownerCheck) {
        const { data: applicationData, error: applicationError } =
          await supabase
            .from("applications")
            .select("*")
            .eq("posting_id", postingId)
            .eq("applicant_id", user.id)
            .maybeSingle();

        // Only handle error if it's not a "not found" error (PGRST116)
        if (applicationError && applicationError.code !== "PGRST116") {
          console.error("Error fetching application:", applicationError);
        }

        if (applicationData) {
          setHasApplied(true);
          setMyApplication(applicationData);
        }

        // Fetch current user's profile for compatibility check
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileData) {
          setCurrentUserProfile(profileData);
          // Auto-compute match breakdown
          computeMatchBreakdown(user.id, data.id);
        }
      }

      // If owner, fetch all applications
      if (ownerCheck) {
        const { data: applicationsData, error: applicationsError } =
          await supabase
            .from("applications")
            .select("*")
            .eq("posting_id", postingId)
            .order("created_at", { ascending: false });

        if (applicationsError) {
          console.error("Error fetching applications:", applicationsError);
        }

        if (applicationsData && applicationsData.length > 0) {
          // Fetch profiles for each applicant
          const applicantIds = applicationsData.map((a) => a.applicant_id);
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("full_name, headline, skills, user_id")
            .in("user_id", applicantIds);

          // Merge profiles with applications
          const applicationsWithProfiles = applicationsData.map((app) => ({
            ...app,
            profiles: profilesData?.find((p) => p.user_id === app.applicant_id),
          }));

          setApplications(applicationsWithProfiles);
        }

        // Fetch matched profiles for owner
        fetchMatchedProfiles(postingId, user?.id || null);
      }

      setIsLoading(false);
    };

    fetchPosting();
  }, [postingId, fetchMatchedProfiles]);

  const computeMatchBreakdown = async (
    userId: string,
    targetPostingId: string,
  ) => {
    setIsComputingMatch(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("compute_match_breakdown", {
        profile_user_id: userId,
        target_posting_id: targetPostingId,
      });

      if (!error && data) {
        setMatchBreakdown(data as ScoreBreakdown);
      }
    } catch (err) {
      console.error("Failed to compute match breakdown:", err);
    } finally {
      setIsComputingMatch(false);
    }
  };

  const handleChange = (field: keyof PostingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("postings")
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        skills: parseList(form.skills),
        estimated_time: form.estimatedTime || null,
        team_size_min: Number(form.teamSizeMin),
        team_size_max: Number(form.teamSizeMax),
        category: form.category,
        mode: form.mode,
        status: form.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postingId);

    setIsSaving(false);

    if (updateError) {
      setError("Failed to update posting. Please try again.");
      return;
    }

    // Refresh posting data
    const { data } = await supabase
      .from("postings")
      .select(
        `
        *,
        profiles:creator_id (
          full_name,
          headline,
          skills,
          user_id
        )
      `,
      )
      .eq("id", postingId)
      .single();

    if (data) {
      setPosting(data);
    }

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this posting? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("postings")
      .delete()
      .eq("id", postingId);

    if (deleteError) {
      setIsDeleting(false);
      setError("Failed to delete posting. Please try again.");
      return;
    }

    router.push("/postings");
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    const supabase = createClient();

    const newExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from("postings")
      .update({
        status: "open",
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", postingId);

    if (updateError) {
      setError("Failed to reactivate posting. Please try again.");
      setIsReactivating(false);
      return;
    }

    // Refresh
    const { data } = await supabase
      .from("postings")
      .select(`*, profiles:creator_id (full_name, headline, skills, user_id)`)
      .eq("id", postingId)
      .single();

    if (data) {
      setPosting(data);
    }
    setIsReactivating(false);
  };

  const handleApply = async () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setIsApplying(true);
    setError(null);

    const supabase = createClient();

    // Create application
    const { data: application, error: applyError } = await supabase
      .from("applications")
      .insert({
        posting_id: postingId,
        applicant_id: currentUserId,
        cover_message: coverMessage.trim() || null,
      })
      .select()
      .single();

    if (applyError) {
      setIsApplying(false);
      setError("Failed to submit application. Please try again.");
      return;
    }

    // Create notification for posting owner
    if (posting) {
      // Get applicant's profile for notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", currentUserId)
        .single();

      const applicantName = profile?.full_name || "Someone";

      await supabase.from("notifications").insert({
        user_id: posting.creator_id,
        type: "application_received",
        title: "New Application Received",
        body: `${applicantName} has applied to your posting "${posting.title}"`,
        related_posting_id: postingId,
        related_application_id: application.id,
        related_user_id: currentUserId,
      });
    }

    setHasApplied(true);
    setMyApplication(application);
    setShowApplyForm(false);
    setCoverMessage("");
    setIsApplying(false);
  };

  const handleWithdrawApplication = async () => {
    if (!myApplication) return;

    if (!confirm("Are you sure you want to withdraw your application?")) {
      return;
    }

    const supabase = createClient();

    const { error: withdrawError } = await supabase
      .from("applications")
      .update({ status: "withdrawn" })
      .eq("id", myApplication.id);

    if (withdrawError) {
      setError("Failed to withdraw application. Please try again.");
      return;
    }

    setMyApplication({ ...myApplication, status: "withdrawn" });
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: "accepted" | "rejected",
  ) => {
    setIsUpdatingApplication(applicationId);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId);

    if (updateError) {
      setError("Failed to update application. Please try again.");
      setIsUpdatingApplication(null);
      return;
    }

    // Find the application to get applicant info
    const application = applications.find((a) => a.id === applicationId);

    // Create notification for applicant
    if (application && posting) {
      await supabase.from("notifications").insert({
        user_id: application.applicant_id,
        type:
          newStatus === "accepted"
            ? "application_accepted"
            : "application_rejected",
        title:
          newStatus === "accepted"
            ? "Application Accepted! 🎉"
            : "Application Update",
        body:
          newStatus === "accepted"
            ? `Your application to "${posting.title}" has been accepted!`
            : `Your application to "${posting.title}" was not selected.`,
        related_posting_id: postingId,
        related_application_id: applicationId,
        related_user_id: posting.creator_id,
      });
    }

    // Update local state
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app,
      ),
    );
    setIsUpdatingApplication(null);
  };

  const handleMessageApplicant = async (applicantId: string) => {
    if (!currentUserId || !posting) return;

    const supabase = createClient();

    // Check if conversation exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("posting_id", postingId)
      .or(
        `and(participant_1.eq.${currentUserId},participant_2.eq.${applicantId}),and(participant_1.eq.${applicantId},participant_2.eq.${currentUserId})`,
      )
      .single();

    if (existingConv) {
      router.push(`/inbox?conversation=${existingConv.id}`);
      return;
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        posting_id: postingId,
        participant_1: currentUserId,
        participant_2: applicantId,
      })
      .select()
      .single();

    if (convError) {
      setError("Failed to start conversation. Please try again.");
      return;
    }

    router.push(`/inbox?conversation=${newConv.id}`);
  };

  const handleContactCreator = async () => {
    if (!currentUserId || !posting) return;

    const supabase = createClient();

    // Check if conversation exists
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("posting_id", postingId)
      .or(
        `and(participant_1.eq.${currentUserId},participant_2.eq.${posting.creator_id}),and(participant_1.eq.${posting.creator_id},participant_2.eq.${currentUserId})`,
      )
      .single();

    if (existingConv) {
      router.push(`/inbox?conversation=${existingConv.id}`);
      return;
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        posting_id: postingId,
        participant_1: currentUserId,
        participant_2: posting.creator_id,
      })
      .select()
      .single();

    if (convError) {
      setError("Failed to start conversation. Please try again.");
      return;
    }

    router.push(`/inbox?conversation=${newConv.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="space-y-6">
        <Link
          href="/postings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to postings
        </Link>
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Posting not found.</p>
            <Button asChild className="mt-4">
              <Link href="/postings">Browse Postings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creatorName = posting.profiles?.full_name || "Unknown";
  const creatorHeadline = posting.profiles?.headline || "";
  const creatorSkills = posting.profiles?.skills || [];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/postings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to postings
      </Link>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {isEditing ? (
              <Input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="text-2xl font-bold"
              />
            ) : (
              <h1 className="text-3xl font-bold tracking-tight">
                {posting.title}
              </h1>
            )}
            <Badge
              variant={
                posting.status === "open"
                  ? isExpired(posting.expires_at)
                    ? "destructive"
                    : "default"
                  : posting.status === "filled"
                    ? "secondary"
                    : "outline"
              }
            >
              {isExpired(posting.expires_at) ? "Expired" : posting.status}
            </Badge>
            {posting.expires_at && (
              <span
                className={`text-xs ${isExpired(posting.expires_at) ? "text-destructive" : "text-muted-foreground"}`}
              >
                {formatExpiry(posting.expires_at)}
              </span>
            )}
            {/* Show compatibility score badge for non-owners */}
            {!isOwner && matchBreakdown && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600 flex items-center gap-1"
              >
                <Sparkles className="h-4 w-4" />
                {formatScore(
                  matchBreakdown.semantic * 0.3 +
                    matchBreakdown.availability * 0.3 +
                    matchBreakdown.skill_level * 0.2 +
                    matchBreakdown.location * 0.2,
                )}{" "}
                match
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Created by {creatorName} • {formatDate(posting.created_at)}
          </p>
        </div>
        {isOwner ? (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {isExpired(posting.expires_at) && (
                  <Button onClick={handleReactivate} disabled={isReactivating}>
                    {isReactivating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Reactivate
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          // Apply button for non-owners
          <div className="flex gap-2">
            {hasApplied ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    myApplication?.status === "accepted"
                      ? "default"
                      : myApplication?.status === "rejected"
                        ? "destructive"
                        : myApplication?.status === "withdrawn"
                          ? "outline"
                          : "secondary"
                  }
                  className="px-3 py-1"
                >
                  {myApplication?.status === "pending" && "Application Pending"}
                  {myApplication?.status === "accepted" && "✓ Accepted"}
                  {myApplication?.status === "rejected" && "Not Selected"}
                  {myApplication?.status === "withdrawn" && "Withdrawn"}
                </Badge>
                {myApplication?.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWithdrawApplication}
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            ) : posting.status === "open" ? (
              showApplyForm ? (
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <textarea
                    value={coverMessage}
                    onChange={(e) => setCoverMessage(e.target.value)}
                    placeholder="Tell the posting creator why you're interested... (optional)"
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleApply} disabled={isApplying}>
                      {isApplying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Application
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowApplyForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowApplyForm(true)}>
                  <Send className="h-4 w-4" />
                  Apply to Posting
                </Button>
              )
            ) : (
              <Badge variant="secondary">Posting {posting.status}</Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this posting</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
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
                    onChange={(e) => handleChange("skills", e.target.value)}
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
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Estimated Time
                      </label>
                      <Input
                        value={form.estimatedTime}
                        onChange={(e) =>
                          handleChange("estimatedTime", e.target.value)
                        }
                        placeholder="e.g., 2 weeks, 1 month"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          handleChange("category", e.target.value)
                        }
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
                      <label className="text-sm font-medium">
                        Team Size Min
                      </label>
                      <select
                        value={form.teamSizeMin}
                        onChange={(e) =>
                          handleChange("teamSizeMin", e.target.value)
                        }
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
                      <label className="text-sm font-medium">
                        Team Size Max
                      </label>
                      <select
                        value={form.teamSizeMax}
                        onChange={(e) =>
                          handleChange("teamSizeMax", e.target.value)
                        }
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
                        onChange={(e) => handleChange("mode", e.target.value)}
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
                        onChange={(e) => handleChange("status", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="filled">Filled</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Team Size
                    </p>
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
                    <p className="mt-2 text-sm text-muted-foreground">
                      Category
                    </p>
                    <p className="font-medium capitalize">
                      {posting.category || "Not specified"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications (for posting owner) */}
          {isOwner && (
            <Card
              className={
                applications.filter((a) => a.status === "pending").length > 0
                  ? "border-primary/50 shadow-md"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${applications.filter((a) => a.status === "pending").length > 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Applications</CardTitle>
                      <CardDescription>
                        {applications.filter((a) => a.status === "pending")
                          .length > 0 ? (
                          <span className="text-primary font-medium">
                            {
                              applications.filter((a) => a.status === "pending")
                                .length
                            }{" "}
                            pending review
                          </span>
                        ) : (
                          `${applications.length} application${applications.length !== 1 ? "s" : ""} received`
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      No applications yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Share your posting to attract collaborators!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          application.status === "pending"
                            ? "border-primary/30 bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                              {getInitials(
                                application.profiles?.full_name || null,
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">
                                  {application.profiles?.full_name || "Unknown"}
                                </h4>
                                {application.status === "pending" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs shrink-0"
                                  >
                                    New
                                  </Badge>
                                )}
                              </div>
                              {application.profiles?.headline && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {application.profiles.headline}
                                </p>
                              )}
                              {application.cover_message && (
                                <div className="mt-2 p-2 rounded bg-muted/50">
                                  <p className="text-sm text-muted-foreground italic">
                                    &quot;{application.cover_message}&quot;
                                  </p>
                                </div>
                              )}
                              {application.profiles?.skills &&
                                application.profiles.skills.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {application.profiles.skills
                                      .slice(0, 5)
                                      .map((skill) => (
                                        <Badge
                                          key={skill}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    {application.profiles.skills.length > 5 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +
                                        {application.profiles.skills.length - 5}{" "}
                                        more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              <p className="mt-2 text-xs text-muted-foreground">
                                Applied {formatDate(application.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleMessageApplicant(application.applicant_id)
                              }
                            >
                              <MessageSquare className="h-4 w-4" />
                              Message
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            {application.status === "pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-500/50 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(
                                      application.id,
                                      "accepted",
                                    )
                                  }
                                  disabled={
                                    isUpdatingApplication === application.id
                                  }
                                >
                                  {isUpdatingApplication === application.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/50 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    handleUpdateApplicationStatus(
                                      application.id,
                                      "rejected",
                                    )
                                  }
                                  disabled={
                                    isUpdatingApplication === application.id
                                  }
                                >
                                  {isUpdatingApplication === application.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      Decline
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              <Badge
                                variant={
                                  application.status === "accepted"
                                    ? "default"
                                    : application.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="capitalize"
                              >
                                {application.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compatibility Check (for non-owners) */}
          {!isOwner && currentUserProfile && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <CardTitle>Your Compatibility</CardTitle>
                </div>
                <CardDescription>
                  How well you match this posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isComputingMatch ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Computing compatibility...
                  </div>
                ) : matchBreakdown ? (
                  <>
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground mb-1">
                        Overall Match
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatScore(
                          matchBreakdown.semantic * 0.3 +
                            matchBreakdown.availability * 0.3 +
                            matchBreakdown.skill_level * 0.2 +
                            matchBreakdown.location * 0.2,
                        )}
                      </p>
                    </div>
                    <MatchBreakdown breakdown={matchBreakdown} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete your profile to see compatibility
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Matched Collaborators (for owners) */}
          {isOwner && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <CardTitle>Matched Collaborators</CardTitle>
                </div>
                <CardDescription>
                  Top profiles that match your posting requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMatches ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : matchedProfiles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No matched profiles found yet. Complete profiles will
                      appear here as they match your posting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchedProfiles.map((matchedProfile) => (
                      <div
                        key={matchedProfile.user_id}
                        className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium shrink-0">
                              {getInitials(matchedProfile.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">
                                  {matchedProfile.full_name || "Anonymous"}
                                </h4>
                                <Badge
                                  variant="default"
                                  className="text-xs shrink-0"
                                >
                                  {formatScore(matchedProfile.overall_score)}
                                </Badge>
                              </div>
                              {matchedProfile.headline && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {matchedProfile.headline}
                                </p>
                              )}
                              {matchedProfile.skills &&
                                matchedProfile.skills.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {matchedProfile.skills
                                      .slice(0, 4)
                                      .map((skill) => (
                                        <Badge
                                          key={skill}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    {matchedProfile.skills.length > 4 && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        +{matchedProfile.skills.length - 4} more
                                      </Badge>
                                    )}
                                  </div>
                                )}

                              {/* Match Breakdown */}
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Semantic:
                                  </span>
                                  <span className="font-medium">
                                    {formatScore(
                                      matchedProfile.breakdown.semantic,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Availability:
                                  </span>
                                  <span className="font-medium">
                                    {formatScore(
                                      matchedProfile.breakdown.availability,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Skill Level:
                                  </span>
                                  <span className="font-medium">
                                    {formatScore(
                                      matchedProfile.breakdown.skill_level,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Location:
                                  </span>
                                  <span className="font-medium">
                                    {formatScore(
                                      matchedProfile.breakdown.location,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/profile/${matchedProfile.user_id}`)
                            }
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleMessageApplicant(matchedProfile.user_id)
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Posting Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {getInitials(creatorName)}
                </div>
                <div>
                  <h4 className="font-medium">{creatorName}</h4>
                  {creatorHeadline && (
                    <p className="text-sm text-muted-foreground">
                      {creatorHeadline}
                    </p>
                  )}
                </div>
              </div>
              {creatorSkills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {creatorSkills.slice(0, 5).map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!isOwner && (
                <Button className="w-full" onClick={handleContactCreator}>
                  <MessageSquare className="h-4 w-4" />
                  Contact Creator
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4" />
                Share Posting
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Flag className="h-4 w-4" />
                Report Issue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
