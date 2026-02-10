/**
 * TypeScript types for Supabase database tables
 * These types match the database schema defined in migrations
 *
 * See docs/DATA_MODEL.md for full schema documentation
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      postings: {
        Row: Posting;
        Insert: PostingInsert;
        Update: PostingUpdate;
      };
      matches: {
        Row: Match;
        Insert: MatchInsert;
        Update: MatchUpdate;
      };
      friend_asks: {
        Row: FriendAsk;
        Insert: FriendAskInsert;
        Update: Partial<FriendAskInsert>;
      };
      friendships: {
        Row: Friendship;
        Insert: FriendshipInsert;
        Update: Partial<FriendshipInsert>;
      };
    };
  };
}

// ============================================
// PROFILE TYPES
// ============================================

export interface Profile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  // Location fields
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  // Skills and matching
  skills: string[] | null;
  interests: string[] | null;
  languages: string[] | null;
  skill_levels: Json | null; // {"domain": 0-10} map
  location_preference: number | null; // 0-1 float (0=in-person, 0.5=either, 1=remote)
  availability_slots: Json | null; // Week-based or block-based format
  // Links
  portfolio_url: string | null;
  github_url: string | null;
  // Matching
  embedding: number[] | null;
  // Data isolation
  is_test_data: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  user_id: string;
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  languages?: string[] | null;
  skill_levels?: Json | null;
  location_preference?: number | null;
  availability_slots?: Json | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  embedding?: number[] | null;
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  user_id?: string;
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  languages?: string[] | null;
  skill_levels?: Json | null;
  location_preference?: number | null;
  availability_slots?: Json | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  embedding?: number[] | null;
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// POSTING TYPES
// ============================================

export interface Posting {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category:
    | "study"
    | "hackathon"
    | "personal"
    | "professional"
    | "social"
    | null;
  context_identifier: string | null;
  tags: string[];
  skills: string[];
  team_size_min: number;
  team_size_max: number;
  mode: "open" | "friend_ask";
  location_preference: number | null; // 0-1 float (0=in-person, 0.5=either, 1=remote)
  natural_language_criteria: string | null;
  estimated_time: string | null;
  skill_level_min: number | null; // 0-10
  embedding: number[] | null;
  status: "open" | "closed" | "filled" | "expired" | "paused";
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface PostingInsert {
  id?: string;
  creator_id: string;
  title: string;
  description: string;
  category?:
    | "study"
    | "hackathon"
    | "personal"
    | "professional"
    | "social"
    | null;
  context_identifier?: string | null;
  tags?: string[];
  skills?: string[];
  team_size_min?: number;
  team_size_max?: number;
  mode?: "open" | "friend_ask";
  location_preference?: number | null;
  natural_language_criteria?: string | null;
  estimated_time?: string | null;
  skill_level_min?: number | null;
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired" | "paused";
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
  expires_at: string;
}

export interface PostingUpdate {
  id?: string;
  creator_id?: string;
  title?: string;
  description?: string;
  category?:
    | "study"
    | "hackathon"
    | "personal"
    | "professional"
    | "social"
    | null;
  context_identifier?: string | null;
  tags?: string[];
  skills?: string[];
  team_size_min?: number;
  team_size_max?: number;
  mode?: "open" | "friend_ask";
  location_preference?: number | null;
  natural_language_criteria?: string | null;
  estimated_time?: string | null;
  skill_level_min?: number | null;
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired" | "paused";
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

// ============================================
// MATCH TYPES
// ============================================

export interface ScoreBreakdown {
  semantic: number; // pgvector cosine similarity (0-1)
  availability: number; // time slot overlap fraction (0-1)
  skill_level: number; // 1 - |levelA - levelB| / 10 (0-1)
  location: number; // 1 - |prefA - prefB| (0-1)
}

export interface Match {
  id: string;
  posting_id: string;
  user_id: string;
  similarity_score: number;
  explanation: string | null;
  score_breakdown: ScoreBreakdown | null;
  status: "pending" | "applied" | "accepted" | "declined" | "interested";
  created_at: string;
  responded_at: string | null;
  updated_at: string;
}

export interface MatchInsert {
  id?: string;
  posting_id: string;
  user_id: string;
  similarity_score: number;
  explanation?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  status?: "pending" | "applied" | "accepted" | "declined" | "interested";
  created_at?: string;
  responded_at?: string | null;
  updated_at?: string;
}

export interface MatchUpdate {
  id?: string;
  posting_id?: string;
  user_id?: string;
  similarity_score?: number;
  explanation?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  status?: "pending" | "applied" | "accepted" | "declined" | "interested";
  created_at?: string;
  responded_at?: string | null;
  updated_at?: string;
}

// ============================================
// FRIEND ASK TYPES
// ============================================

export interface FriendAsk {
  id: string;
  posting_id: string;
  creator_id: string;
  ordered_friend_list: string[];
  current_request_index: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface FriendAskInsert {
  id?: string;
  posting_id: string;
  creator_id: string;
  ordered_friend_list: string[];
  current_request_index?: number;
  status?: "pending" | "accepted" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

// ============================================
// FRIENDSHIP TYPES
// ============================================

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
}

export interface FriendshipInsert {
  id?: string;
  user_id: string;
  friend_id: string;
  status?: "pending" | "accepted" | "declined" | "blocked";
  created_at?: string;
}

// ============================================
// MATCH WITH DETAILS (JOINED TYPES)
// ============================================

export interface MatchWithPosting extends Match {
  posting: Posting;
}

export interface MatchWithProfile extends Match {
  profile: Profile;
}

export interface MatchWithDetails extends Match {
  posting: Posting;
  profile: Profile;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface MatchResponse {
  id: string;
  posting?: Posting;
  profile?: Profile;
  score: number;
  explanation: string | null;
  score_breakdown: ScoreBreakdown | null;
  status: Match["status"];
  created_at: string;
}
