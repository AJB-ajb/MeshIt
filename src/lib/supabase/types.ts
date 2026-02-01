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
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
      };
      matches: {
        Row: Match;
        Insert: MatchInsert;
        Update: MatchUpdate;
      };
    };
  };
}

// ============================================
// SHARED TYPES
// ============================================

/**
 * Hard filters for match scoring
 * Used by both profiles (to filter projects) and projects (to filter applicants)
 * Matches violating filters receive penalized scores but still appear in results
 */
export interface HardFilters {
  max_distance_km?: number;  // Maximum distance in kilometers
  min_hours?: number;        // Minimum commitment hours/week
  max_hours?: number;        // Maximum commitment hours/week
  languages?: string[];      // Required spoken languages (ISO codes)
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
  location: string | null;           // Legacy: human-readable location for display
  location_lat: number | null;       // Latitude for distance-based matching
  location_lng: number | null;       // Longitude for distance-based matching
  // Experience and availability
  experience_level: string | null;
  collaboration_style: string | null; // Legacy: kept for UI (async, sync, hybrid)
  remote_preference: number | null;   // 0-100: 0=on-site, 100=fully remote
  availability_hours: number | null;
  // Skills and interests
  skills: string[] | null;
  interests: string[] | null;
  languages: string[] | null;         // Spoken languages (ISO codes: en, de, es)
  // Links
  portfolio_url: string | null;
  github_url: string | null;
  // Preferences and filters
  project_preferences: Json;
  hard_filters: HardFilters | null;
  // Matching
  embedding: number[] | null;         // vector(1536) stored as array
  // Data isolation
  is_test_data: boolean;              // Flag for test/mock data vs production data
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
  experience_level?: string | null;
  collaboration_style?: string | null;
  remote_preference?: number | null;
  availability_hours?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  languages?: string[] | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  project_preferences?: Json;
  hard_filters?: HardFilters | null;
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
  experience_level?: string | null;
  collaboration_style?: string | null;
  remote_preference?: number | null;
  availability_hours?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  languages?: string[] | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  project_preferences?: Json;
  hard_filters?: HardFilters | null;
  embedding?: number[] | null;
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// PROJECT TYPES
// ============================================

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  required_skills: string[];
  team_size: number;
  experience_level: string | null;
  commitment_hours: number | null;
  timeline: string | null;
  hard_filters: HardFilters | null;   // Filters for scoring applicants
  embedding: number[] | null;         // vector(1536) stored as array
  status: "open" | "closed" | "filled" | "expired";
  is_test_data: boolean;              // Flag for test/mock data vs production data
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface ProjectInsert {
  id?: string;
  creator_id: string;
  title: string;
  description: string;
  required_skills?: string[];
  team_size?: number;
  experience_level?: string | null;
  commitment_hours?: number | null;
  timeline?: string | null;
  hard_filters?: HardFilters | null;
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired";
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
  expires_at: string;
}

export interface ProjectUpdate {
  id?: string;
  creator_id?: string;
  title?: string;
  description?: string;
  required_skills?: string[];
  team_size?: number;
  experience_level?: string | null;
  commitment_hours?: number | null;
  timeline?: string | null;
  hard_filters?: HardFilters | null;
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired";
  is_test_data?: boolean;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

// ============================================
// MATCH TYPES
// ============================================

export interface ScoreBreakdown {
  semantic: number;         // pgvector similarity (0-1)
  skills_overlap: number;   // % of required skills user has (0-1)
  experience_match: number; // experience level compatibility (0-1)
  commitment_match: number; // hours alignment (0-1)
  location_match: number;   // location + remote preference compatibility (0-1)
  filter_match: number;     // hard filter compliance score (0-1)
}

export interface Match {
  id: string;
  project_id: string;
  user_id: string;
  similarity_score: number; // 0-1 range
  explanation: string | null;
  score_breakdown: ScoreBreakdown | null;
  status: "pending" | "applied" | "accepted" | "declined";
  created_at: string;
  responded_at: string | null;
  updated_at: string;
}

export interface MatchInsert {
  id?: string;
  project_id: string;
  user_id: string;
  similarity_score: number;
  explanation?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  status?: "pending" | "applied" | "accepted" | "declined";
  created_at?: string;
  responded_at?: string | null;
  updated_at?: string;
}

export interface MatchUpdate {
  id?: string;
  project_id?: string;
  user_id?: string;
  similarity_score?: number;
  explanation?: string | null;
  score_breakdown?: ScoreBreakdown | null;
  status?: "pending" | "applied" | "accepted" | "declined";
  created_at?: string;
  responded_at?: string | null;
  updated_at?: string;
}

// ============================================
// MATCH WITH DETAILS (JOINED TYPES)
// ============================================

export interface MatchWithProject extends Match {
  project: Project;
}

export interface MatchWithProfile extends Match {
  profile: Profile;
}

export interface MatchWithDetails extends Match {
  project: Project;
  profile: Profile;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface MatchResponse {
  id: string;
  project?: Project;
  profile?: Profile;
  score: number; // 0-1, displayed as percentage
  explanation: string | null;
  score_breakdown: ScoreBreakdown | null;
  status: Match["status"];
  created_at: string;
}
