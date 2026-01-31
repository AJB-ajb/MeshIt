/**
 * TypeScript types for Supabase database tables
 * These types match the database schema defined in migrations
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
// PROFILE TYPES
// ============================================

export interface Profile {
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  experience_level: string | null;
  collaboration_style: string | null;
  availability_hours: number | null;
  skills: string[] | null;
  interests: string[] | null;
  portfolio_url: string | null;
  github_url: string | null;
  project_preferences: Json;
  embedding: number[] | null; // vector(1536) stored as array
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  user_id: string;
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  experience_level?: string | null;
  collaboration_style?: string | null;
  availability_hours?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  project_preferences?: Json;
  embedding?: number[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdate {
  user_id?: string;
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  experience_level?: string | null;
  collaboration_style?: string | null;
  availability_hours?: number | null;
  skills?: string[] | null;
  interests?: string[] | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  project_preferences?: Json;
  embedding?: number[] | null;
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
  embedding: number[] | null; // vector(1536) stored as array
  status: "open" | "closed" | "filled" | "expired";
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
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired";
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
  embedding?: number[] | null;
  status?: "open" | "closed" | "filled" | "expired";
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

// ============================================
// MATCH TYPES
// ============================================

export interface Match {
  id: string;
  project_id: string;
  user_id: string;
  similarity_score: number; // 0-1 range
  explanation: string | null;
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
  status: Match["status"];
  created_at: string;
}
